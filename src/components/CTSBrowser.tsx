import React, { useState, useCallback } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ILayoutRestorer } from '@jupyterlab/application';
import { IStateDB } from '@jupyterlab/statedb';
import { Box, Typography } from '@mui/material';
import { useJobs, useJobDetail } from '../api/ctsApi';
import { IJobFilters } from '../types/jobs';
import { TokenInput } from './TokenInput';
import { JobFilters } from './JobFilters';
import { JobList } from './JobList';
import { JobDetail } from './JobDetail';

export interface ICTSBrowserProps {
  jupyterApp: JupyterFrontEnd;
  restorer: ILayoutRestorer;
  stateDB: IStateDB;
}

export const CTSBrowser: React.FC<ICTSBrowserProps> = ({
  jupyterApp,
  restorer,
  stateDB
}) => {
  // State
  const [token, setToken] = useState<string>('');
  const [filters, setFilters] = useState<IJobFilters>({});
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Queries - pass token to all hooks
  const jobsQuery = useJobs(filters, token);
  const jobDetailQuery = useJobDetail(selectedJobId, token);

  // Handlers
  const handleTokenChange = useCallback((newToken: string) => {
    setToken(newToken);
  }, []);

  const handleFiltersChange = useCallback((newFilters: IJobFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    jobsQuery.refetch();
  }, [jobsQuery]);

  const handleSelectJob = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedJobId(null);
  }, []);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover'
        }}
      >
        <Typography
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
        >
          CTS Jobs
        </Typography>
      </Box>

      {/* Token Input */}
      <TokenInput token={token} onTokenChange={handleTokenChange} />

      {/* Filters */}
      <JobFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        isRefreshing={jobsQuery.isFetching}
      />

      {/* Job List */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {!token ? (
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.7rem' }} color="text.secondary">
              Enter token or "mock" to view jobs
            </Typography>
          </Box>
        ) : (
          <JobList
            jobs={jobsQuery.data}
            isLoading={jobsQuery.isLoading}
            error={jobsQuery.error}
            selectedJobId={selectedJobId}
            onSelectJob={handleSelectJob}
          />
        )}
      </Box>

      {/* Job Detail Panel */}
      {selectedJobId && (
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            maxHeight: '50%',
            overflow: 'auto'
          }}
        >
          <JobDetail
            job={jobDetailQuery.data}
            isLoading={jobDetailQuery.isLoading}
            error={jobDetailQuery.error}
            onClose={handleCloseDetail}
            token={token}
          />
        </Box>
      )}
    </Box>
  );
};
