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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CTSBrowser } from './components/CTSBrowser';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';

const EXTENSION_ID = 'berdl-cts-browser';
const PLUGIN_ID = `${EXTENSION_ID}:plugin`;
const ICON_ID = `${EXTENSION_ID}:icon`;
const PANEL_ID = `${EXTENSION_ID}-panel`;
const COMMAND_SELECT_JOB = 'cts-browser:select-job';

// Create LabIcon from FontAwesome icon
const browserIcon = new LabIcon({
  name: ICON_ID,
  svgstr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${faListCheck.icon[0]} ${faListCheck.icon[1]}"><path fill="currentColor" d="${faListCheck.icon[4]}"/></svg>`
});

// Global callback for selecting a job (set by CTSBrowser component)
let selectJobCallback: ((jobId: string) => void) | null = null;

export function registerSelectJobCallback(
  callback: (jobId: string) => void
): void {
  selectJobCallback = callback;
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
    console.log('JupyterLab extension berdl-cts-browser is activated!');

    // Expose app globally for Python widget integration
    (window as unknown as Record<string, unknown>).jupyterapp = app;

    // Create QueryClient for React Query
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          staleTime: 1000 * 60 * 5 // 5 minutes
        }
      }
    });

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
          console.warn('cts-browser:select-job called without jobId');
          return;
        }

        // Activate the sidebar panel
        app.shell.activateById(panel.id);

        // Select the job in the browser
        if (selectJobCallback) {
          selectJobCallback(jobId);
        } else {
          console.warn(
            'CTSBrowser not ready - selectJobCallback not registered'
          );
        }
      }
    });
  }
};

export default plugin;
