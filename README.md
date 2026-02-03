# berdl_task_browser

[![Github Actions Status](https://github.com/BERDataLakehouse/berdl_task_browser/workflows/Build/badge.svg)](https://github.com/BERDataLakehouse/berdl_task_browser/actions/workflows/build.yml)

A JupyterLab extension for browsing CTS data

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install berdl_task_browser
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall berdl_task_browser
```

## Contributing

### Development install

Note: You will need NodeJS and [uv](https://docs.astral.sh/uv/) to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab.

```bash
# Clone the repo to your local environment
# Change directory to the berdl_task_browser directory

# Install dependencies with uv
uv sync

# Link your development version of the extension with JupyterLab
uv run jupyter labextension develop . --overwrite

# Rebuild extension Typescript source after making changes
# IMPORTANT: Unlike the steps above which are performed only once, do this step
# every time you make a change.
uv run jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
uv run jlpm watch
# Run JupyterLab in another terminal
KBASE_AUTH_TOKEN=your-token \
CDM_TASK_SERVICE_URL=https://ci.kbase.us/services/cts \
uv run jupyter lab
```

#### Environment Variables

| Variable | Description |
|----------|-------------|
| `KBASE_AUTH_TOKEN` | Auth token for CTS API (required) |
| `CDM_TASK_SERVICE_URL` | CTS API endpoint (defaults to CI) |
| `CTS_MOCK_MODE` | Set to `true` to enable mock mode |

#### Mock Mode

For development without a real CTS API, enable mock mode:

```bash
CTS_MOCK_MODE=true uv run jupyter lab
```

Or toggle at runtime in browser console:
```javascript
window.kbase.task_browser.mockMode = true
```

Mock mode uses [MSW (Mock Service Worker)](https://mswjs.io/) to intercept API requests and return test data.

#### CORS Proxy (Alternative)

If you need to test against the real CTS API from localhost:

```bash
uv run python scripts/cts_proxy.py
```

This starts a CORS-enabled proxy on `localhost:8080`.

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
uv pip uninstall berdl_task_browser
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `berdl-task-browser` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
uv run jlpm
uv run jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
