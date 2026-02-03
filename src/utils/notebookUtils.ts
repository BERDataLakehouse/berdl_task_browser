/**
 * Notebook utilities for injecting code cells into JupyterLab notebooks
 */

import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';

/**
 * Insert a code cell at the current position in the active notebook
 * @param notebookTracker - JupyterLab notebook tracker
 * @param code - Python code to insert
 * @returns true if successful, false otherwise
 */
export function insertCodeCell(
  notebookTracker: INotebookTracker | null,
  code: string
): boolean {
  if (!notebookTracker) {
    console.warn('notebookTracker is not available');
    return false;
  }

  const notebook = notebookTracker.currentWidget;
  if (!notebook) {
    console.warn('No active notebook found');
    return false;
  }

  const notebookPanel = notebook;
  const notebookModel = notebookPanel.content;

  if (!notebookModel) {
    console.warn('Notebook model not available');
    return false;
  }

  // Insert a new cell below the current position
  NotebookActions.insertBelow(notebookModel);

  // Get the newly created cell
  const activeCell = notebookModel.activeCell;
  if (activeCell && activeCell.model) {
    // Set the cell content
    activeCell.model.sharedModel.setSource(code);
    return true;
  }

  return false;
}

/**
 * Generate Python code for creating a CTS job
 */
export interface IJobCreationParams {
  image: string;
  inputFiles: string;
  outputDir: string;
  cluster?: string;
  cpus?: number;
  memory?: string;
  args?: string;
}

export function generateJobCreationCode(params: IJobCreationParams): string {
  const { image, inputFiles, outputDir, cluster, cpus, memory, args } = params;

  const lines: string[] = [
    'from berdl_notebook_utils import get_task_service_client',
    'from berdl_task_browser import show_job',
    '',
    'client = get_task_service_client()',
    '',
    'job = client.submit_job(',
    `    image="${image}",`
  ];

  if (inputFiles.trim()) {
    lines.push(`    input_files=${inputFiles.trim()},`);
  }

  lines.push(`    output_dir="${outputDir}",`);

  if (cluster) {
    lines.push(`    cluster="${cluster}",`);
  }
  if (cpus !== undefined) {
    lines.push(`    cpus=${cpus},`);
  }
  if (memory) {
    lines.push(`    memory="${memory}",`);
  }
  if (args) {
    lines.push(`    args=${args},`);
  }

  lines.push(')');
  lines.push('');
  lines.push('show_job(job.job_id)');

  return lines.join('\n');
}

/**
 * Generate Python code for viewing an existing job
 */
export function generateJobViewCode(jobId: string): string {
  return `from berdl_task_browser import show_job

show_job('${jobId}')`;
}
