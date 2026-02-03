import { Dialog, showDialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { INotebookTracker } from '@jupyterlab/notebook';
import {
  insertCodeCell,
  generateJobCreationCode
} from '../utils/notebookUtils';

export interface IWizardFormData {
  image: string;
  inputFiles: string[];
  outputDir: string;
  cluster: string;
  cpus: number | undefined;
  memory: string;
  args: string[];
}

export class JobWizardBody
  extends Widget
  implements Dialog.IBodyWidget<IWizardFormData>
{
  private _imageInput!: HTMLInputElement;
  private _inputFilesContainer!: HTMLDivElement;
  private _inputFiles: string[] = [];
  private _outputDirInput!: HTMLInputElement;
  private _clusterInput!: HTMLInputElement;
  private _cpusInput!: HTMLInputElement;
  private _memoryInput!: HTMLInputElement;
  private _argsContainer!: HTMLDivElement;
  private _errorDisplay!: HTMLDivElement;
  private _args: string[] = [];

  constructor(initialData?: IWizardFormData) {
    super();
    this.addClass('jp-JobWizard');
    this._buildForm();
    if (initialData) {
      this._populateForm(initialData);
    }
  }

  private _populateForm(data: IWizardFormData): void {
    this._imageInput.value = data.image;
    this._outputDirInput.value = data.outputDir;
    this._clusterInput.value = data.cluster;
    if (data.cpus !== undefined) {
      this._cpusInput.value = String(data.cpus);
    }
    this._memoryInput.value = data.memory;
    for (const file of data.inputFiles) {
      this._addInputFile(file);
    }
    for (const arg of data.args) {
      this._addArg(arg);
    }
  }

  private _buildForm(): void {
    this._errorDisplay = document.createElement('div');
    this._errorDisplay.className = 'jp-JobWizard-error';
    this._errorDisplay.style.display = 'none';
    this.node.appendChild(this._errorDisplay);

    this._imageInput = this._createTextField(
      'image',
      'Image *',
      'ghcr.io/kbase/app:latest',
      true
    );

    const inputFilesSection = document.createElement('div');
    inputFilesSection.className = 'jp-JobWizard-field';
    const inputFilesLabel = document.createElement('label');
    inputFilesLabel.textContent = 'Input Files';
    inputFilesSection.appendChild(inputFilesLabel);

    this._inputFilesContainer = document.createElement('div');
    this._inputFilesContainer.className = 'jp-JobWizard-args';
    inputFilesSection.appendChild(this._inputFilesContainer);

    const addInputFileButton = document.createElement('button');
    addInputFileButton.type = 'button';
    addInputFileButton.className =
      'jp-mod-styled jp-mod-accept jp-JobWizard-addArg';
    addInputFileButton.textContent = '+ Add input file';
    addInputFileButton.addEventListener('click', () => this._addInputFile());
    inputFilesSection.appendChild(addInputFileButton);

    this.node.appendChild(inputFilesSection);

    this._outputDirInput = this._createTextField(
      'outputDir',
      'Output Directory *',
      '/output',
      true
    );
    this._outputDirInput.value = '/output';

    const rowContainer = document.createElement('div');
    rowContainer.className = 'jp-JobWizard-row';

    const clusterField = document.createElement('div');
    clusterField.className = 'jp-JobWizard-field jp-JobWizard-fieldFlex';
    const clusterLabel = document.createElement('label');
    clusterLabel.textContent = 'Cluster';
    clusterLabel.htmlFor = 'cluster';
    this._clusterInput = document.createElement('input');
    this._clusterInput.type = 'text';
    this._clusterInput.name = 'cluster';
    this._clusterInput.className = 'jp-mod-styled';
    this._clusterInput.placeholder = 'perlmutter';
    clusterField.appendChild(clusterLabel);
    clusterField.appendChild(this._clusterInput);
    rowContainer.appendChild(clusterField);

    const cpusField = document.createElement('div');
    cpusField.className = 'jp-JobWizard-field jp-JobWizard-fieldSmall';
    const cpusLabel = document.createElement('label');
    cpusLabel.textContent = 'CPUs';
    cpusLabel.htmlFor = 'cpus';
    this._cpusInput = document.createElement('input');
    this._cpusInput.type = 'number';
    this._cpusInput.name = 'cpus';
    this._cpusInput.className = 'jp-mod-styled';
    this._cpusInput.min = '1';
    cpusField.appendChild(cpusLabel);
    cpusField.appendChild(this._cpusInput);
    rowContainer.appendChild(cpusField);

    const memoryField = document.createElement('div');
    memoryField.className = 'jp-JobWizard-field jp-JobWizard-fieldSmall';
    const memoryLabel = document.createElement('label');
    memoryLabel.textContent = 'Memory';
    memoryLabel.htmlFor = 'memory';
    this._memoryInput = document.createElement('input');
    this._memoryInput.type = 'text';
    this._memoryInput.name = 'memory';
    this._memoryInput.className = 'jp-mod-styled';
    this._memoryInput.placeholder = '4Gi';
    memoryField.appendChild(memoryLabel);
    memoryField.appendChild(this._memoryInput);
    rowContainer.appendChild(memoryField);

    this.node.appendChild(rowContainer);

    const argsSection = document.createElement('div');
    argsSection.className = 'jp-JobWizard-field';
    const argsLabel = document.createElement('label');
    argsLabel.textContent = 'Args';
    argsSection.appendChild(argsLabel);

    this._argsContainer = document.createElement('div');
    this._argsContainer.className = 'jp-JobWizard-args';
    argsSection.appendChild(this._argsContainer);

    const addArgButton = document.createElement('button');
    addArgButton.type = 'button';
    addArgButton.className = 'jp-mod-styled jp-mod-accept jp-JobWizard-addArg';
    addArgButton.textContent = '+ Add argument';
    addArgButton.addEventListener('click', () => this._addArg());
    argsSection.appendChild(addArgButton);

    this.node.appendChild(argsSection);
  }

  private _createTextField(
    name: string,
    label: string,
    placeholder: string,
    required: boolean
  ): HTMLInputElement {
    const field = document.createElement('div');
    field.className = 'jp-JobWizard-field';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = name;
    field.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.name = name;
    input.className = '';
    input.placeholder = placeholder;
    input.required = required;
    field.appendChild(input);

    this.node.appendChild(field);
    return input;
  }

  private _addInputFile(value = ''): void {
    const index = this._inputFiles.length;
    this._inputFiles.push(value);

    const row = document.createElement('div');
    row.className = 'jp-JobWizard-argRow';
    row.dataset.index = String(index);
    row.dataset.type = 'inputFile';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = '';
    input.placeholder = 's3://bucket/file.txt';
    input.value = value;
    input.addEventListener('input', e => {
      const idx = parseInt(row.dataset.index || '0', 10);
      this._inputFiles[idx] = (e.target as HTMLInputElement).value;
    });

    input.addEventListener('paste', e => {
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && pastedText.includes('\n')) {
        e.preventDefault();
        const lines = pastedText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        if (lines.length > 0) {
          const idx = parseInt(row.dataset.index || '0', 10);
          this._inputFiles[idx] = lines[0];
          input.value = lines[0];
          for (let i = 1; i < lines.length; i++) {
            this._addInputFile(lines[i]);
          }
        }
      }
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'jp-mod-styled jp-mod-warn jp-JobWizard-removeArg';
    removeButton.textContent = '×';
    removeButton.title = 'Remove input file';
    removeButton.addEventListener('click', () => this._removeInputFile(row));

    row.appendChild(input);
    row.appendChild(removeButton);
    this._inputFilesContainer.appendChild(row);
  }

  private _removeInputFile(row: HTMLDivElement): void {
    const index = parseInt(row.dataset.index || '0', 10);
    this._inputFiles.splice(index, 1);
    row.remove();

    const rows = this._inputFilesContainer.querySelectorAll(
      '.jp-JobWizard-argRow'
    );
    rows.forEach((r, i) => {
      (r as HTMLDivElement).dataset.index = String(i);
    });
  }

  private _addArg(value = ''): void {
    const index = this._args.length;
    this._args.push(value);

    const row = document.createElement('div');
    row.className = 'jp-JobWizard-argRow';
    row.dataset.index = String(index);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = '';
    input.placeholder = '--flag or value';
    input.value = value;
    input.addEventListener('input', e => {
      const idx = parseInt(row.dataset.index || '0', 10);
      this._args[idx] = (e.target as HTMLInputElement).value;
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'jp-mod-styled jp-mod-warn jp-JobWizard-removeArg';
    removeButton.textContent = '×';
    removeButton.title = 'Remove argument';
    removeButton.addEventListener('click', () => this._removeArg(row));

    row.appendChild(input);
    row.appendChild(removeButton);
    this._argsContainer.appendChild(row);
  }

  private _removeArg(row: HTMLDivElement): void {
    const index = parseInt(row.dataset.index || '0', 10);
    this._args.splice(index, 1);
    row.remove();

    const rows = this._argsContainer.querySelectorAll('.jp-JobWizard-argRow');
    rows.forEach((r, i) => {
      (r as HTMLDivElement).dataset.index = String(i);
    });
  }

  private _showError(message: string): void {
    this._errorDisplay.textContent = message;
    this._errorDisplay.style.display = 'block';
  }

  private _hideError(): void {
    this._errorDisplay.style.display = 'none';
  }

  private _validate(): boolean {
    this._hideError();

    if (!this._imageInput.value.trim()) {
      this._showError('Image is required');
      this._imageInput.focus();
      return false;
    }

    if (!this._outputDirInput.value.trim()) {
      this._showError('Output directory is required');
      this._outputDirInput.focus();
      return false;
    }

    return true;
  }

  getValue(): IWizardFormData {
    const cpusValue = this._cpusInput.value;
    const cpus = cpusValue ? parseFloat(cpusValue) : undefined;

    return {
      image: this._imageInput.value.trim(),
      inputFiles: this._inputFiles.filter(f => f.trim().length > 0),
      outputDir: this._outputDirInput.value.trim(),
      cluster: this._clusterInput.value.trim(),
      cpus: cpus && !isNaN(cpus) ? cpus : undefined,
      memory: this._memoryInput.value.trim(),
      args: this._args.filter(arg => arg.trim().length > 0)
    };
  }

  validate(): boolean {
    return this._validate();
  }
}

export async function showJobWizardDialog(
  notebookTracker: INotebookTracker | null,
  initialData?: IWizardFormData
): Promise<boolean> {
  const body = new JobWizardBody(initialData);

  const result = await showDialog({
    title: 'Create CTS Job',
    body,
    buttons: [
      Dialog.cancelButton(),
      Dialog.createButton({ label: 'Source' }),
      Dialog.okButton({ label: 'Insert' })
    ],
    focusNodeSelector: 'input[name="image"]'
  });

  if (result.button.label === 'Source') {
    if (body.validate()) {
      const formData = body.getValue();
      const code = generateJobCreationCode({
        image: formData.image,
        inputFiles: formData.inputFiles,
        outputDir: formData.outputDir,
        cluster: formData.cluster || undefined,
        cpus: formData.cpus,
        memory: formData.memory || undefined,
        args: formData.args
      });

      const codeWidget = new Widget();
      codeWidget.node.innerHTML = `<pre style="background: var(--jp-layout-color2); padding: 12px; border-radius: 4px; overflow: auto; max-height: 400px; font-family: var(--jp-code-font-family); font-size: var(--jp-code-font-size); margin: 0; white-space: pre-wrap;"></pre>`;
      codeWidget.node.querySelector('pre')!.textContent = code;

      await showDialog({
        title: 'Generated Code',
        body: codeWidget,
        buttons: [Dialog.okButton({ label: 'Close' })]
      });

      return showJobWizardDialog(notebookTracker, formData);
    }
    return false;
  }

  if (result.button.accept) {
    if (!body.validate()) {
      return showJobWizardDialog(notebookTracker, body.getValue());
    }

    const formData = result.value;
    if (!formData) {
      return false;
    }

    if (!notebookTracker?.currentWidget) {
      await showDialog({
        title: 'Error',
        body: 'No active notebook found. Please open a notebook first.',
        buttons: [Dialog.okButton()]
      });
      return showJobWizardDialog(notebookTracker, formData);
    }

    const code = generateJobCreationCode({
      image: formData.image,
      inputFiles: formData.inputFiles,
      outputDir: formData.outputDir,
      cluster: formData.cluster || undefined,
      cpus: formData.cpus,
      memory: formData.memory || undefined,
      args: formData.args
    });

    const success = insertCodeCell(notebookTracker, code);
    if (!success) {
      await showDialog({
        title: 'Error',
        body: 'Failed to insert code into notebook',
        buttons: [Dialog.okButton()]
      });
      return showJobWizardDialog(notebookTracker, formData);
    }

    return true;
  }

  return false;
}
