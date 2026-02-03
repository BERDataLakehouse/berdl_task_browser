import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { PageConfig } from '@jupyterlab/coreutils';
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
import { faListCheck } from '@fortawesome/free-solid-svg-icons';

// Shared MUI theme for sidebar and embedded widgets
const theme = createTheme();

// Store QueryClient for use by renderJobWidget
let sharedQueryClient: QueryClient | null = null;

const EXTENSION_ID = 'berdl-task-browser';
const PLUGIN_ID = `${EXTENSION_ID}:plugin`;
const ICON_ID = `${EXTENSION_ID}:icon`;
const PANEL_ID = `${EXTENSION_ID}-panel`;
const COMMAND_SELECT_JOB = 'task-browser:select-job';

// Create LabIcon from FontAwesome icon
const browserIcon = new LabIcon({
  name: ICON_ID,
  svgstr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${faListCheck.icon[0]} ${faListCheck.icon[1]}"><path fill="currentColor" d="${faListCheck.icon[4]}"/></svg>`
});

// Get CTS namespace from window
function getCTSNamespace(): ICTSNamespace | null {
  const win = window as unknown as Record<string, unknown>;
  const kbase = win.kbase as Record<string, unknown> | undefined;
  return (kbase?.cts as ICTSNamespace) || null;
}

export function registerSelectJobCallback(
  callback: (jobId: string) => void
): void {
  const cts = getCTSNamespace();
  if (cts) {
    cts.selectJob = callback;
  }
}

// CTS namespace for console commands and shared state
interface ICTSNamespace {
  mockMode: boolean;
  token: string | null;
  app: JupyterFrontEnd | null;
  selectJob: ((jobId: string) => void) | null;
  renderJobWidget: ((element: HTMLElement, jobId: string) => () => void) | null;
}

/**
 * Get auth token from cookies or PageConfig
 */
function getAuthToken(): string | null {
  // First try cookie (production with JupyterHub login)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'kbase_session') {
      return value;
    }
  }

  // Fall back to PageConfig (dev mode, set from KBASE_AUTH_TOKEN env var)
  const tokenFromConfig = PageConfig.getOption('kbaseAuthToken');
  if (tokenFromConfig) {
    return tokenFromConfig;
  }

  return null;
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

  const token = getAuthToken();
  const root: Root = createRoot(element);

  root.render(
    React.createElement(
      ThemeProvider,
      { theme },
      React.createElement(
        QueryClientProvider,
        { client: sharedQueryClient },
        React.createElement(JobEmbedWidget, { jobId, token })
      )
    )
  );

  // Return cleanup function
  return () => {
    root.unmount();
  };
}

/**
 * Register CTS namespace on window.kbase.cts
 * Usage:
 *   window.kbase.cts.mockMode = true       // Enable mock mode
 *   window.kbase.cts.token                 // Auth token (from env or cookie)
 *   window.kbase.cts.app                   // JupyterLab app instance
 *   window.kbase.cts.selectJob(id)         // Select job in sidebar
 *   window.kbase.cts.renderJobWidget(el, id) // Render widget into element
 */
function registerCTSNamespace(app: JupyterFrontEnd): void {
  const win = window as unknown as Record<string, unknown>;
  const existing = (win.kbase as Record<string, unknown>) || {};

  const token = getAuthToken();

  const ctsNamespace: ICTSNamespace = {
    mockMode: false,
    token: token,
    app: app,
    selectJob: null,
    renderJobWidget: renderJobWidget
  };

  win.kbase = {
    ...existing,
    cts: ctsNamespace
  };

  console.log(
    '[CTS] Namespace registered. Token:',
    token ? 'found' : 'not found'
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

    // Register CTS namespace on window.kbase.cts
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

    // Create a React widget wrapped with QueryClientProvider
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

    // Create sidebar panel
    const panel = new Panel();
    panel.id = PANEL_ID;
    panel.title.closable = true;
    panel.title.icon = browserIcon;
    panel.title.label = '';

    // Configure widget styling
    widget.addClass('jp-CTSBrowserWidget-root');
    widget.node.style.height = '100%';
    widget.node.style.overflow = 'hidden';

    // Assemble and register panel
    panel.addWidget(widget);
    app.shell.add(panel, 'left', { rank: 1 });
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

        // Activate the sidebar panel
        app.shell.activateById(panel.id);

        // Select the job in the browser
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
