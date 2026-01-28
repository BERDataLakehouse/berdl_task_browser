import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { JobState, IJobFilters } from '../types/jobs';

interface IJobFiltersProps {
  filters: IJobFilters;
  onFiltersChange: (filters: IJobFilters) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

type FilterStateValue = JobState | 'all';

const STATE_OPTIONS: { value: FilterStateValue; label: string }[] = [
  { value: 'all', label: 'All Jobs' },
  { value: 'created', label: 'Created' },
  { value: 'download_submitted', label: 'Downloading' },
  { value: 'job_submitted', label: 'Running' },
  { value: 'upload_submitted', label: 'Uploading' },
  { value: 'complete', label: 'Complete' },
  { value: 'error', label: 'Error' },
  { value: 'canceling', label: 'Canceling' },
  { value: 'canceled', label: 'Canceled' }
];

const CLUSTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Clusters' },
  { value: 'perlmutter', label: 'Perlmutter' },
  { value: 'lawrencium', label: 'Lawrencium' },
  { value: 'kbase', label: 'KBase' }
];

export const JobFilters: React.FC<IJobFiltersProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  isRefreshing
}) => {
  const handleStateChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as FilterStateValue;
    onFiltersChange({
      ...filters,
      state: value === 'all' ? undefined : value
    });
  };

  const handleClusterChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      cluster: value === 'all' ? undefined : value
    });
  };

  const currentStateValue: FilterStateValue = filters.state || 'all';
  const currentClusterValue: string = filters.cluster || 'all';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}
    >
      <FormControl size="small" sx={{ flex: 1 }}>
        <Select
          value={currentStateValue}
          onChange={handleStateChange}
          displayEmpty
          sx={{
            fontSize: '0.7rem',
            '& .MuiSelect-select': { py: 0.5, px: 1 }
          }}
        >
          {STATE_OPTIONS.map(option => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{ fontSize: '0.7rem', py: 0.5, minHeight: 0 }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ flex: 1 }}>
        <Select
          value={currentClusterValue}
          onChange={handleClusterChange}
          displayEmpty
          sx={{
            fontSize: '0.7rem',
            '& .MuiSelect-select': { py: 0.5, px: 1 }
          }}
        >
          {CLUSTER_OPTIONS.map(option => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{ fontSize: '0.7rem', py: 0.5, minHeight: 0 }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <IconButton
        onClick={onRefresh}
        disabled={isRefreshing}
        size="small"
        title="Refresh"
        sx={{
          p: 0.5,
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        <FontAwesomeIcon
          icon={faSync}
          spin={isRefreshing}
          style={{ fontSize: '0.65rem' }}
        />
      </IconButton>
    </Box>
  );
};
