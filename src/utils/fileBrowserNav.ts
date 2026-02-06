/**
 * Utility for navigating the JupyterLab file browser to a given path.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';

export const COMMAND_NAVIGATE_TO_PATH = 'berdl-task-browser:navigate-to-path';

/**
 * Register the navigate-to-path command on the app.
 * Delegates to filebrowser:go-to-path internally.
 */
export function registerNavigateCommand(app: JupyterFrontEnd): void {
  app.commands.addCommand(COMMAND_NAVIGATE_TO_PATH, {
    label: 'Navigate to File Path',
    execute: args => {
      const path = args.path as string;
      if (path) {
        app.commands.execute('filebrowser:go-to-path', { path });
      }
    }
  });
}

/**
 * Navigate the JupyterLab file browser to the given path.
 * Uses the registered berdl-task-browser:navigate-to-path command.
 */
export function navigateFileBrowser(
  app: JupyterFrontEnd,
  jupyterLabPath: string
): void {
  app.commands.execute(COMMAND_NAVIGATE_TO_PATH, { path: jupyterLabPath });
}
