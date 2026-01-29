import React, { useState, useCallback, useEffect } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ILayoutRestorer } from '@jupyterlab/application';
import { IStateDB } from '@jupyterlab/statedb';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useJobs, useJobDetail } from '../api/ctsApi';
import { IJobFilters } from '../types/jobs';
import { JobFilters } from './JobFilters';
import { JobList } from './JobList';
import { JobDetail } from './JobDetail';
import { JobWizard } from './JobWizard';
import { registerSelectJobCallback } from '../index';

export interface ICTSBrowserProps {
  jupyterApp: JupyterFrontEnd;
  restorer: ILayoutRestorer;
  stateDB: IStateDB;
  notebookTracker: INotebookTracker | null;
}

// Get token from window.kbase.cts namespace
function getTokenFromNamespace(): string {
  const win = window as unknown as Record<string, unknown>;
  const kbase = win.kbase as Record<string, unknown> | undefined;
  const cts = kbase?.cts as { token?: string } | undefined;
  return cts?.token || '';
}

export const CTSBrowser: React.FC<ICTSBrowserProps> = ({
  jupyterApp,
  restorer,
  stateDB,
  notebookTracker
}) => {
  // State - token is auto-detected from window.kbase.cts namespace
  const token = getTokenFromNamespace();
  const [filters, setFilters] = useState<IJobFilters>({});
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Register callback for external job selection (from Python widget)
  useEffect(() => {
    registerSelectJobCallback((jobId: string) => {
      setSelectedJobId(jobId);
    });
  }, []);

  // Queries - pass token to all hooks
  const jobsQuery = useJobs(filters, token);
  const jobDetailQuery = useJobDetail(selectedJobId, token);

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
    setWizardOpen(true);
  }, []);

  const handleCloseWizard = useCallback(() => {
    setWizardOpen(false);
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
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
        >
          CTS Jobs
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
        {!token ? (
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
            overflow: 'hidden'
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

      {/* Job Wizard Dialog */}
      <JobWizard
        open={wizardOpen}
        onClose={handleCloseWizard}
        notebookTracker={notebookTracker}
      />
    </Box>
  );
};
