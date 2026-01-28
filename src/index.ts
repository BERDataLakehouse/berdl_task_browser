import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { IStateDB } from '@jupyterlab/statedb';

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

// Create LabIcon from FontAwesome icon
const browserIcon = new LabIcon({
  name: ICON_ID,
  svgstr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${faListCheck.icon[0]} ${faListCheck.icon[1]}"><path fill="currentColor" d="${faListCheck.icon[4]}"/></svg>`
});

/**
 * BERDL CTS Browser JupyterLab extension plugin
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'A JupyterLab extension for browsing CTS data',
  autoStart: true,
  requires: [ILayoutRestorer, IStateDB],
  activate: (
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    stateDB: IStateDB
  ) => {
    console.log('JupyterLab extension berdl-cts-browser is activated!');

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
        React.createElement(CTSBrowser, { jupyterApp: app, restorer, stateDB })
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
  }
};

export default plugin;
