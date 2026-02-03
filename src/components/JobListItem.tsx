import React from 'react';
import { ListItemButton, Box, Typography, Chip } from '@mui/material';
import { IJob } from '../types/jobs';
import { StatusChip } from './StatusChip';

interface IJobListItemProps {
  job: IJob;
  selected: boolean;
  onClick: () => void;
}

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

const getLastUpdateTime = (job: IJob): string => {
  if (job.transition_times && job.transition_times.length > 0) {
    const lastTransition =
      job.transition_times[job.transition_times.length - 1];
    return formatRelativeTime(lastTransition.time);
  }
  return '';
};

export const JobListItem: React.FC<IJobListItemProps> = ({
  job,
  selected,
  onClick
}) => {
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 0.5,
        px: 1,
        minHeight: 0,
        '&:hover': { bgcolor: 'action.hover' }
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.5
          }}
        >
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {job.id}
          </Typography>
          <Typography
            sx={{ fontSize: '0.6rem', color: 'text.secondary', flexShrink: 0 }}
          >
            {getLastUpdateTime(job)}
          </Typography>
        </Box>
        <Box
          sx={{
            mt: 0.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <StatusChip state={job.state} />
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
        </Box>
      </Box>
    </ListItemButton>
  );
};
