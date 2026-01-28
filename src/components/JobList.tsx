import React from 'react';
import { List, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { IJob } from '../types/jobs';
import { JobListItem } from './JobListItem';

interface IJobListProps {
  jobs: IJob[] | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
}

export const JobList: React.FC<IJobListProps> = ({
  jobs,
  isLoading,
  error,
  selectedJobId,
  onSelectJob
}) => {
  if (isLoading && !jobs) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 0.5, py: 0.25, fontSize: '0.7rem' }}>
        {error.message}
      </Alert>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.7rem' }} color="text.secondary">
          No jobs found
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
      {jobs.map(job => (
        <JobListItem
          key={job.id}
          job={job}
          selected={job.id === selectedJobId}
          onClick={() => onSelectJob(job.id)}
        />
      ))}
    </List>
  );
};
