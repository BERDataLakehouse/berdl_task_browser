# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **berdl-cts-browser**, a JupyterLab 4.x extension for browsing CTS (Compute Transfer Service) job data. It includes:

- **Sidebar panel** - Browse and monitor CTS jobs
- **Job Wizard** - Generate Python code for job submission
- **Python widget** - `show_job()` for inline job status in notebooks

## Development Commands

### Setup (first time)

```bash
uv sync
uv run jupyter labextension develop . --overwrite
uv run jlpm install
```

### Core Commands

- `uv run jlpm build` - Build extension for development (TypeScript + labextension)
- `uv run jlpm build:prod` - Production build (clean first)
- `uv run jlpm watch` - Watch mode for development (run `jupyter lab` in separate terminal)

### Testing

- `uv run jlpm test` - Run Jest unit tests with coverage
- Run single test file: `uv run jlpm jest src/__tests__/mytest.spec.ts`
- Integration tests (Playwright): `cd ui-tests && uv run jlpm playwright test`

### Code Quality

- `uv run jlpm lint` - Auto-fix all linting (stylelint + prettier + eslint)
- `uv run jlpm lint:check` - Check without fixing (used in CI)

### Running JupyterLab (Development)

```bash
KBASE_AUTH_TOKEN=your-token uv run jupyter lab
```

The `KBASE_AUTH_TOKEN` env var is required for API access. In production (JupyterHub), this is set automatically.

## Architecture

### Extension Entry Point

`src/index.ts` - Defines the JupyterLab plugin that:

- Registers a sidebar panel (left side, rank 1)
- Creates a React widget wrapped with TanStack Query's `QueryClientProvider`
- Registers `window.kbase.cts` namespace for token/state sharing
- Exposes `cts-browser:select-job` command for Python widget integration

### Server Extension

`berdl_cts_browser/__init__.py` - Exposes `KBASE_AUTH_TOKEN` via PageConfig for JS access.

### Component Structure

```
src/
├── index.ts              # Plugin registration, QueryClient setup, window.kbase.cts
├── config.ts             # API base URL, polling intervals
├── types/jobs.ts         # TypeScript types for CTS job data
├── api/
│   ├── ctsApi.ts         # API client + React Query hooks
│   └── mockData.ts       # Mock data for mock mode
├── utils/
│   └── notebookUtils.ts  # Cell injection, code generation for wizard
└── components/
    ├── CTSBrowser.tsx    # Main container, state management
    ├── TokenInput.tsx    # Auth token input
    ├── JobFilters.tsx    # Filter controls (state, date range)
    ├── JobList.tsx       # Job list display
    ├── JobListItem.tsx   # Individual job row
    ├── JobDetail.tsx     # Expanded job details panel
    ├── JobWizard.tsx     # Job creation wizard dialog
    └── StatusChip.tsx    # Job state badge

berdl_cts_browser/
├── __init__.py           # Package init, server extension
└── viewer.py             # Python widget (show_job, JobWidget)
```

### Token Handling

**Production (JupyterHub):**
- Python: `KBASE_AUTH_TOKEN` env var (set by JupyterHub pre_spawn_start)
- JS: `kbase_session` cookie from browser

**Development:**
- Set `KBASE_AUTH_TOKEN` env var when starting JupyterLab
- Server extension exposes it via PageConfig
- JS reads from PageConfig, falls back to cookies
- Sidebar auto-populates token from `window.kbase.cts.token`

### Console Commands

```javascript
window.kbase.cts.mockMode = true   // Enable mock mode
window.kbase.cts.token             // Current auth token
window.kbase.cts.app               // JupyterLab app instance
window.kbase.cts.selectJob(id)     // Select job in sidebar
```

### Key Patterns

**State Management**: Local React state + TanStack Query for server state. No Redux.

**API Layer** (`src/api/ctsApi.ts`):

- `useJobs(filters, token)` - Fetch job list with auto-polling (30s)
- `useJobDetail(jobId, token)` - Fetch single job details
- `useJobStatus(jobId, token, currentState)` - Poll job status (5s for active jobs)
- Mock mode: Enable via console `window.kbase.cts.mockMode = true`

**Job States** (`src/types/jobs.ts`):

- Active: `created`, `download_submitted`, `job_submitting`, `job_submitted`, `upload_submitting`, `upload_submitted`
- Terminal: `complete`, `error`, `canceled`
- Error processing: `error_processing_submitting`, `error_processing_submitted`

### Python Widget

```python
from berdl_cts_browser import show_job

# Display auto-refreshing job status widget
show_job('job-id-here')  # Token from KBASE_AUTH_TOKEN env var
```

### Job Wizard

The wizard (magic wand button in sidebar) generates code using `cdm-task-service-client`:

```python
from cdmtaskserviceclient import CTSClient
from berdl_cts_browser import show_job

client = CTSClient()  # Token from env var

job = client.submit_job(
    image="ghcr.io/kbase/app:latest",
    input_files=["s3://bucket/file.txt"],
    output_dir="/output",
)

show_job(job.job_id)
```

### Styling

- Material-UI components with sx prop styling
- CSS files in `style/` for JupyterLab integration

### Configuration

`src/config.ts`:

- `CTS_API_BASE` - API endpoint (defaults to CI environment)
- Polling intervals configurable here

## Code Conventions

- **Interfaces**: Must be prefixed with `I` (e.g., `IJob`, `IJobFilters`) - enforced by ESLint
- **Quotes**: Single quotes for strings (enforced)
- **Arrow functions**: Preferred for callbacks
- Uses `jlpm` (JupyterLab's yarn) instead of npm/yarn directly
