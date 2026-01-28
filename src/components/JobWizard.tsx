import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { INotebookTracker } from '@jupyterlab/notebook';
import {
  insertCodeCell,
  generateJobCreationCode,
  IJobCreationParams
} from '../utils/notebookUtils';

export interface IJobWizardProps {
  open: boolean;
  onClose: () => void;
  notebookTracker: INotebookTracker | null;
}

const INITIAL_STATE: IJobCreationParams = {
  image: '',
  inputFiles: '[]',
  outputDir: '/output',
  cluster: '',
  cpus: undefined,
  memory: '',
  args: ''
};

export const JobWizard: React.FC<IJobWizardProps> = ({
  open,
  onClose,
  notebookTracker
}) => {
  const [params, setParams] = useState<IJobCreationParams>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = useCallback(
    (field: keyof IJobCreationParams) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setParams(prev => ({
          ...prev,
          [field]:
            field === 'cpus'
              ? value === ''
                ? undefined
                : parseFloat(value)
              : value
        }));
        setError(null);
      },
    []
  );

  const handleClose = useCallback(() => {
    setParams(INITIAL_STATE);
    setError(null);
    setCopied(false);
    onClose();
  }, [onClose]);

  const generateCode = useCallback(() => {
    if (!params.image.trim()) {
      setError('Image is required');
      return null;
    }
    if (!params.outputDir.trim()) {
      setError('Output directory is required');
      return null;
    }

    return generateJobCreationCode(params);
  }, [params]);

  const handleInsertCode = useCallback(() => {
    const code = generateCode();
    if (!code) {
      return;
    }

    if (!notebookTracker?.currentWidget) {
      setError('No active notebook found. Please open a notebook first.');
      return;
    }

    const success = insertCodeCell(notebookTracker, code);
    if (success) {
      handleClose();
    } else {
      setError('Failed to insert code into notebook');
    }
  }, [generateCode, notebookTracker, handleClose]);

  const handleCopyCode = useCallback(async () => {
    const code = generateCode();
    if (!code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [generateCode]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 1.5, display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" component="span" sx={{ flexGrow: 1 }}>
          Create CTS Job
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          size="small"
          sx={{ color: 'grey.500' }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 1.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Image"
          value={params.image}
          onChange={handleChange('image')}
          fullWidth
          required
          size="small"
          sx={{ mb: 1.5 }}
          placeholder="ghcr.io/kbase/app:latest"
        />

        <TextField
          label="Input Files (Python list)"
          value={params.inputFiles}
          onChange={handleChange('inputFiles')}
          fullWidth
          size="small"
          sx={{ mb: 1.5 }}
          placeholder='["s3://bucket/file1.txt", "s3://bucket/file2.txt"]'
        />

        <TextField
          label="Output Directory"
          value={params.outputDir}
          onChange={handleChange('outputDir')}
          fullWidth
          required
          size="small"
          sx={{ mb: 1.5 }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField
            label="Cluster"
            value={params.cluster}
            onChange={handleChange('cluster')}
            size="small"
            sx={{ flex: 1 }}
            placeholder="perlmutter"
          />
          <TextField
            label="CPUs"
            value={params.cpus ?? ''}
            onChange={handleChange('cpus')}
            type="number"
            size="small"
            sx={{ width: 80 }}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Memory"
            value={params.memory}
            onChange={handleChange('memory')}
            size="small"
            sx={{ width: 100 }}
            placeholder="4Gi"
          />
        </Box>

        <TextField
          label="Args (Python list)"
          value={params.args}
          onChange={handleChange('args')}
          fullWidth
          size="small"
          placeholder='["--input", "/input/file.txt"]'
        />
      </DialogContent>

      <DialogActions sx={{ px: 1.5, py: 1 }}>
        <Tooltip title={copied ? 'Copied!' : 'Copy code to clipboard'}>
          <Button
            size="small"
            startIcon={<FontAwesomeIcon icon={copied ? faCheck : faCopy} />}
            onClick={handleCopyCode}
            color={copied ? 'success' : 'inherit'}
          >
            Copy
          </Button>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={handleClose}>
          Cancel
        </Button>
        <Button size="small" variant="contained" onClick={handleInsertCode}>
          Insert
        </Button>
      </DialogActions>
    </Dialog>
  );
};
