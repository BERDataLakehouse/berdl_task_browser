/**
 * Embeddable job status widget for Python notebook cells.
 * Rendered via window.kbase.cts.renderJobWidget()
 */

import React from 'react';
import { Box, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { useJobDetail } from '../api/ctsApi';
import { StatusChip } from './StatusChip';
import { IJob } from '../types/jobs';

export interface IJobEmbedWidgetProps {
  jobId: string;
  token: string | null;
}

// Format timestamp to relative time (same as JobListItem)
const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${diffDays}d ago`;
};

// Get the most recent transition time
const getLastUpdateTime = (job: IJob): string => {
  if (job.transition_times && job.transition_times.length > 0) {
    const lastTransition =
      job.transition_times[job.transition_times.length - 1];
    return formatRelativeTime(lastTransition.time);
  }
  return '';
};

export const JobEmbedWidget: React.FC<IJobEmbedWidgetProps> = ({
  jobId,
  token
}) => {
  const { data: job, isLoading, error } = useJobDetail(jobId, token || undefined);

  const handleViewInfo = () => {
    const win = window as unknown as Record<string, unknown>;
    const kbase = win.kbase as Record<string, unknown> | undefined;
    const cts = kbase?.cts as {
      app?: { commands?: { execute: (cmd: string, args: unknown) => void } };
    } | undefined;

    if (cts?.app?.commands) {
      cts.app.commands.execute('task-browser:select-job', { jobId });
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        py: 0.5,
        px: 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      {error ? (
        <Typography sx={{ fontSize: '0.65rem', color: 'error.main' }}>
          Failed to load
        </Typography>
      ) : isLoading || !job ? (
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
          Loading...
        </Typography>
      ) : (
        <>
          {/* Status chip */}
          <StatusChip state={job.state} />

          {/* Job ID */}
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.7rem'
            }}
          >
            {jobId}
          </Typography>

          {/* Cluster chip */}
          {job.cluster && (
            <Chip
              label={job.cluster}
              size="small"
              variant="outlined"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                '& .MuiChip-label': { px: 0.75 }
              }}
            />
          )}

          {/* Relative time */}
          {getLastUpdateTime(job) && (
            <Typography
              sx={{ fontSize: '0.6rem', color: 'text.secondary' }}
            >
              {getLastUpdateTime(job)}
            </Typography>
          )}
        </>
      )}

      {/* View info button */}
      <Tooltip title="View in sidebar">
        <IconButton
          size="small"
          onClick={handleViewInfo}
          sx={{ p: 0.25 }}
        >
          <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: '0.75rem' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
