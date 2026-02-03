import React, { useState, useCallback, useEffect } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ILayoutRestorer } from '@jupyterlab/application';
import { IStateDB } from '@jupyterlab/statedb';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useJobs, useJobDetail } from '../api/ctsApi';
import { IJob, IJobFilters } from '../types/jobs';
import { JobFilters } from './JobFilters';
import { JobList } from './JobList';
import { JobDetail } from './JobDetail';
import { showJobWizardDialog } from '../dialogs/JobWizardDialog';
import { registerSelectJobCallback } from '../index';
import { getToken } from '../auth/token';

export interface ICTSBrowserProps {
  jupyterApp: JupyterFrontEnd;
  restorer: ILayoutRestorer;
  stateDB: IStateDB;
  notebookTracker: INotebookTracker | null;
}

export const CTSBrowser: React.FC<ICTSBrowserProps> = ({
  jupyterApp,
  restorer,
  stateDB,
  notebookTracker
}) => {
  const [filters, setFilters] = useState<IJobFilters>({});
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Register callback for external job selection (from Python widget)
  useEffect(() => {
    registerSelectJobCallback((jobId: string) => {
      setSelectedJobId(jobId);
    });
  }, []);

  const jobsQuery = useJobs(filters);
  const jobDetailQuery = useJobDetail(selectedJobId);

  // Handlers
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

  const handleOpenWizard = useCallback(() => {
    showJobWizardDialog(notebookTracker);
  }, [notebookTracker]);

  const getStatusSummary = (jobs: IJob[] | undefined): string => {
    if (!jobs || jobs.length === 0) return 'No jobs';
    return `${jobs.length} job${jobs.length === 1 ? '' : 's'}`;
  };

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
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {getStatusSummary(jobsQuery.data)}
        </Typography>
        <Tooltip title="Create Job">
          <IconButton size="small" onClick={handleOpenWizard} sx={{ p: 0.25 }}>
            <FontAwesomeIcon
              icon={faWandMagicSparkles}
              style={{ fontSize: '0.7rem' }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <JobFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        isRefreshing={jobsQuery.isFetching}
      />

      {/* Job List */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {!getToken() ? (
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.7rem' }} color="text.secondary">
              No auth token found. Set KBASE_AUTH_TOKEN environment variable.
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
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
            position: 'relative',
            zIndex: 2
          }}
        >
          <JobDetail
            job={jobDetailQuery.data}
            isLoading={jobDetailQuery.isLoading}
            error={jobDetailQuery.error}
            onClose={handleCloseDetail}
          />
        </Box>
      )}
    </Box>
  );
};
