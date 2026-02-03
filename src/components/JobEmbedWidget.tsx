/**
 * Embeddable job status widget for Python notebook cells.
 * Rendered via window.kbase.task_browser.renderJobWidget()
 */

import React from 'react';
import { Box, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { useJobDetail } from '../api/ctsApi';
import { StatusChip } from './StatusChip';
import { getLastUpdateTime } from '../utils/dateUtils';
import { IKBaseWindow } from '../index';

export interface IJobEmbedWidgetProps {
  jobId: string;
}

export const JobEmbedWidget: React.FC<IJobEmbedWidgetProps> = ({ jobId }) => {
  const { data: job, isLoading, error } = useJobDetail(jobId);

  const handleViewInfo = () => {
    const win = window as unknown as IKBaseWindow;
    const cts = win.kbase?.task_browser;

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
          {job.job_input?.cluster && (
            <Chip
              label={job.job_input.cluster}
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
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
              {getLastUpdateTime(job)}
            </Typography>
          )}
        </>
      )}

      {/* View info button */}
      <Tooltip title="View in sidebar">
        <IconButton size="small" onClick={handleViewInfo} sx={{ p: 0.25 }}>
          <FontAwesomeIcon
            icon={faCircleInfo}
            style={{ fontSize: '0.75rem' }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
