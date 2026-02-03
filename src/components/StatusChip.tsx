import React from 'react';
import { Chip } from '@mui/material';
import { JobState, isErrorState } from '../types/jobs';

interface IStatusChipProps {
  state: JobState;
  size?: 'small' | 'medium';
}

const STATE_LABELS: Record<JobState, string> = {
  created: 'Created',
  download_submitted: 'Downloading',
  job_submitting: 'Submitting',
  job_submitted: 'Running',
  upload_submitting: 'Uploading',
  upload_submitted: 'Uploading',
  complete: 'Complete',
  error_processing_submitting: 'Error Processing',
  error_processing_submitted: 'Error Processing',
  error: 'Error',
  canceling: 'Canceling',
  canceled: 'Canceled'
};

type ChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

const getStateColor = (state: JobState): ChipColor => {
  if (state === 'complete') {
    return 'success';
  }
  if (isErrorState(state)) {
    return 'error';
  }
  if (state === 'canceled' || state === 'canceling') {
    return 'warning';
  }
  if (state === 'created') {
    return 'default';
  }
  // Running states
  return 'info';
};

export const StatusChip: React.FC<IStatusChipProps> = ({
  state,
  size = 'small'
}) => {
  return (
    <Chip
      label={STATE_LABELS[state] || state}
      color={getStateColor(state)}
      size={size}
      sx={{
        height: 18,
        fontSize: '0.65rem',
        '& .MuiChip-label': { px: 0.75 }
      }}
    />
  );
};
