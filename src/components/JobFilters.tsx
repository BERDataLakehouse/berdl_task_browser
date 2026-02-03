import React, { useMemo } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { JobState, IJobFilters, JOB_STATES } from '../types/jobs';
import { useSites } from '../api/ctsApi';

interface IJobFiltersProps {
  filters: IJobFilters;
  onFiltersChange: (filters: IJobFilters) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

type FilterStateValue = JobState | 'all';

const formatStateLabel = (state: string): string => {
  return state
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const STATE_OPTIONS: { value: FilterStateValue; label: string }[] = [
  { value: 'all', label: 'All Jobs' },
  ...JOB_STATES.map(state => ({
    value: state,
    label: formatStateLabel(state)
  }))
];

const formatClusterLabel = (cluster: string): string => {
  return cluster
    .replace(/-jaws$/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const JobFilters: React.FC<IJobFiltersProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  isRefreshing
}) => {
  const { data: sites } = useSites();

  const clusterOptions = useMemo(() => {
    const options: {
      value: string;
      label: string;
      disabled?: boolean;
      tooltip?: string;
    }[] = [{ value: 'all', label: 'All Clusters' }];

    if (sites) {
      for (const site of sites) {
        if (site.active) {
          options.push({
            value: site.cluster,
            label: formatClusterLabel(site.cluster),
            disabled: !site.available,
            tooltip: site.unavailable_reason
          });
        }
      }
    }

    return options;
  }, [sites]);

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
          {clusterOptions.map(option =>
            option.tooltip ? (
              <Tooltip
                key={option.value}
                title={option.tooltip}
                placement="right"
              >
                <span>
                  <MenuItem
                    value={option.value}
                    disabled={option.disabled}
                    sx={{ fontSize: '0.7rem', py: 0.5, minHeight: 0 }}
                  >
                    {option.label}
                  </MenuItem>
                </span>
              </Tooltip>
            ) : (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                sx={{ fontSize: '0.7rem', py: 0.5, minHeight: 0 }}
              >
                {option.label}
              </MenuItem>
            )
          )}
        </Select>
      </FormControl>

      <IconButton
        onClick={onRefresh}
        disabled={isRefreshing}
        size="small"
        aria-label="Refresh job list"
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
