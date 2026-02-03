import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { IStateDB } from '@jupyterlab/statedb';
import { INotebookTracker } from '@jupyterlab/notebook';

import { Panel } from '@lumino/widgets';
import { LabIcon } from '@jupyterlab/ui-components';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CTSBrowser } from './components/CTSBrowser';
import { JobEmbedWidget } from './components/JobEmbedWidget';
import { faBarsProgress } from '@fortawesome/free-solid-svg-icons';
import { PageConfig } from '@jupyterlab/coreutils';
import { getToken } from './auth/token';

// Shared MUI theme for sidebar and embedded widgets
const theme = createTheme();

// Store QueryClient for use by renderJobWidget
let sharedQueryClient: QueryClient | null = null;

const EXTENSION_ID = 'berdl-task-browser';
const PLUGIN_ID = `${EXTENSION_ID}:plugin`;
const ICON_ID = `${EXTENSION_ID}:icon`;
const PANEL_ID = `${EXTENSION_ID}-panel`;
const COMMAND_SELECT_JOB = 'task-browser:select-job';

const browserIcon = new LabIcon({
  name: ICON_ID,
  svgstr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${faBarsProgress.icon[0]} ${faBarsProgress.icon[1]}"><path fill="currentColor" d="${faBarsProgress.icon[4]}"/></svg>`
});

/**
 * CTS namespace interface for window.kbase.task_browser
 */
export interface ICTSNamespace {
  mockMode: boolean;
  getToken: () => string;
  app: JupyterFrontEnd | null;
  selectJob: ((jobId: string) => void) | null;
  renderJobWidget: ((element: HTMLElement, jobId: string) => () => void) | null;
}

/**
 * Typed window interface for KBase namespace access
 */
export interface IKBaseWindow extends Window {
  kbase?: {
    task_browser?: ICTSNamespace;
    [key: string]: unknown;
  };
}

function getCTSNamespace(): ICTSNamespace | null {
  const win = window as unknown as IKBaseWindow;
  return win.kbase?.task_browser || null;
}

export function registerSelectJobCallback(
  callback: (jobId: string) => void
): void {
  const cts = getCTSNamespace();
  if (cts) {
    cts.selectJob = callback;
  }
}

/**
 * Render a job status widget into a DOM element.
 * Returns a cleanup function to unmount the widget.
 */
function renderJobWidget(element: HTMLElement, jobId: string): () => void {
  if (!sharedQueryClient) {
    console.error('[CTS] QueryClient not initialized');
    element.innerHTML =
      '<span style="color: red; font-size: 11px;">CTS extension not ready</span>';
    return () => {};
  }

  const root: Root = createRoot(element);

  root.render(
    React.createElement(
      ThemeProvider,
      { theme },
      React.createElement(
        QueryClientProvider,
        { client: sharedQueryClient },
        React.createElement(JobEmbedWidget, { jobId })
      )
    )
  );

  return () => {
    root.unmount();
  };
}

/**
 * Register window.kbase.task_browser namespace for shared state and console access.
 *
 * This namespace serves as:
 * 1. Bridge for Python widget (show_job) to render React components
 * 2. Console debugging interface
 *
 * Mock mode can be enabled via:
 *   - Environment variable: CTS_MOCK_MODE=true (set when starting JupyterLab)
 *   - Console: window.kbase.task_browser.mockMode = true
 *
 * Console usage:
 *   window.kbase.task_browser.mockMode = true         // Enable mock mode
 *   window.kbase.task_browser.getToken()              // Get current auth token
 *   window.kbase.task_browser.app                     // JupyterLab app instance
 *   window.kbase.task_browser.selectJob(id)           // Select job in sidebar
 *   window.kbase.task_browser.renderJobWidget(el, id) // Render widget into DOM element
 */
/**
 * Start MSW worker for mock mode
 */
async function startMockServiceWorker(): Promise<void> {
  try {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true
    });
    console.log('[CTS] Mock Service Worker started');
  } catch (error) {
    console.error('[CTS] Failed to start Mock Service Worker:', error);
  }
}

function registerCTSNamespace(app: JupyterFrontEnd): void {
  const win = window as unknown as IKBaseWindow;
  const existing = win.kbase || {};

  const mockModeFromEnv = PageConfig.getOption('ctsMockMode') === 'true';

  const ctsNamespace: ICTSNamespace = {
    mockMode: mockModeFromEnv,
    getToken: getToken,
    app: app,
    selectJob: null,
    renderJobWidget: renderJobWidget
  };

  win.kbase = {
    ...existing,
    task_browser: ctsNamespace
  };

  // Start MSW if mock mode is enabled
  if (mockModeFromEnv) {
    startMockServiceWorker();
  }

  const token = getToken();
  console.log(
    '[CTS] Namespace registered. Token:',
    token ? 'found' : 'not found',
    '| Mock mode:',
    mockModeFromEnv ? 'enabled' : 'disabled'
  );
}

/**
 * BERDL CTS Browser JupyterLab extension plugin
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'A JupyterLab extension for browsing CTS data',
  autoStart: true,
  requires: [ILayoutRestorer, IStateDB],
  optional: [INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    stateDB: IStateDB,
    notebookTracker: INotebookTracker | null
  ) => {
    console.log('JupyterLab extension berdl-task-browser is activated!');

    registerCTSNamespace(app);

    // Create QueryClient for React Query (shared for embedded widgets)
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          staleTime: 1000 * 60 * 5 // 5 minutes
        }
      }
    });
    sharedQueryClient = queryClient;

    const widget = ReactWidget.create(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(CTSBrowser, {
          jupyterApp: app,
          restorer,
          stateDB,
          notebookTracker
        })
      )
    );

    const panel = new Panel();
    panel.id = PANEL_ID;
    panel.title.closable = true;
    panel.title.icon = browserIcon;
    panel.title.label = '';

    widget.addClass('jp-CTSBrowserWidget-root');
    widget.node.style.height = '100%';
    widget.node.style.overflow = 'hidden';

    panel.addWidget(widget);
    app.shell.add(panel, 'left', { rank: 1000 });
    restorer.add(panel, PANEL_ID);

    // Register command to select a job from external sources (e.g., Python widget)
    app.commands.addCommand(COMMAND_SELECT_JOB, {
      label: 'Select CTS Job',
      execute: args => {
        const jobId = args.jobId as string;
        if (!jobId) {
          console.warn('task-browser:select-job called without jobId');
          return;
        }

        app.shell.activateById(panel.id);

        const cts = getCTSNamespace();
        if (cts?.selectJob) {
          cts.selectJob(jobId);
        } else {
          console.warn(
            'CTSBrowser not ready - selectJob callback not registered'
          );
        }
      }
    });
  }
};

export default plugin;
