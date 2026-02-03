import React from 'react';
import { ListItemButton, Box, Typography, Chip } from '@mui/material';
import { IJob } from '../types/jobs';
import { StatusChip } from './StatusChip';
import { getLastUpdateTime } from '../utils/dateUtils';

interface IJobListItemProps {
  job: IJob;
  selected: boolean;
  onClick: () => void;
}

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
        </Box>
      </Box>
    </ListItemButton>
  );
};
