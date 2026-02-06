/**
 * Window namespace types for KBase/CTS integration
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { S3Mappings } from '../utils/s3PathResolver';

/**
 * CTS namespace interface for window.kbase.task_browser
 */
export interface ICTSNamespace {
  getToken: () => string;
  app: JupyterFrontEnd | null;
  selectJob: ((jobId: string) => void) | null;
  renderJobWidget: ((element: HTMLElement, jobId: string) => () => void) | null;
  s3Mappings: S3Mappings | null;
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
