import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Chip
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBan } from '@fortawesome/free-solid-svg-icons';
import {
  IJob,
  ITransitionTime,
  isTerminalState,
  isCancelableState
} from '../types/jobs';
import { StatusChip } from './StatusChip';
import { LogViewer } from './LogViewer';
import { useCancelJob, useJobExitCodes } from '../api/ctsApi';

interface IJobDetailProps {
  job: IJob | undefined;
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
}

const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

const StateTimeline: React.FC<{ transitions: ITransitionTime[] }> = ({
  transitions
}) => {
  if (!transitions || transitions.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.65rem' }} color="text.secondary">
        No state transitions
      </Typography>
    );
  }

  return (
    <Box sx={{ pl: 0.5 }}>
      {transitions.map((transition, index) => (
        <Box
          key={`${transition.state}-${index}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            py: 0.125,
            borderLeft: '1px solid',
            borderColor: 'divider',
            pl: 0.5,
            ml: 0.25
          }}
        >
          <StatusChip state={transition.state} size="small" />
          <Typography sx={{ fontSize: '0.6rem' }} color="text.secondary">
            {formatTimestamp(transition.time)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export const JobDetail: React.FC<IJobDetailProps> = ({
  job,
  isLoading,
  error,
  onClose
}) => {
  const cancelMutation = useCancelJob();
  const exitCodesQuery = useJobExitCodes(
    job?.id || null,
    job ? isTerminalState(job.state) : false
  );

  const handleCancel = () => {
    if (job) {
      cancelMutation.mutate(job.id);
    }
  };

  if (isLoading && !job) {
    return (
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="error" sx={{ py: 0.25, fontSize: '0.7rem' }}>
          {error.message}
        </Alert>
      </Box>
    );
  }

  if (!job) {
    return null;
  }

  const labelSx = {
    fontSize: '0.6rem',
    color: 'text.secondary',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  };
  const valueSx = { fontSize: '0.7rem' };
  const canCancel = isCancelableState(job.state);

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
    >
      {/* Fixed Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 -2px 4px rgba(0,0,0,0.12)',
          position: 'relative',
          zIndex: 1,
          flexShrink: 0
        }}
      >
        <Typography
          sx={{
            fontSize: '0.6rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'text.secondary',
            letterSpacing: '0.05em'
          }}
        >
          Job Details
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ p: 0.25, opacity: 0.6, '&:hover': { opacity: 1 } }}
        >
          <FontAwesomeIcon icon={faTimes} style={{ fontSize: '0.6rem' }} />
        </IconButton>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ p: 1, overflow: 'auto', flex: 1, minHeight: 0 }}>
        {/* Two-column grid for compact info */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0.75,
            mb: 0.75
          }}
        >
          {/* Status */}
          <Box>
            <Typography sx={labelSx}>Status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StatusChip state={job.state} />
              {canCancel && (
                <Button
                  size="small"
                  color="warning"
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  startIcon={
                    cancelMutation.isPending ? (
                      <CircularProgress size={10} />
                    ) : (
                      <FontAwesomeIcon icon={faBan} />
                    )
                  }
                  sx={{
                    fontSize: '0.6rem',
                    py: 0.25,
                    px: 0.75,
                    minWidth: 0,
                    textTransform: 'none',
                    '& .MuiButton-startIcon': {
                      mr: 0.5,
                      '& svg': { fontSize: '0.6rem' }
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>

          {/* User */}
          {job.user && (
            <Box>
              <Typography sx={labelSx}>User</Typography>
              <Typography sx={valueSx}>{job.user}</Typography>
            </Box>
          )}

          {/* Cluster */}
          {job.cluster && (
            <Box>
              <Typography sx={labelSx}>Cluster</Typography>
              <Chip
                label={job.cluster}
                size="small"
                variant="outlined"
                sx={{
                  height: 16,
                  fontSize: '0.6rem',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            </Box>
          )}

          {/* File counts */}
          {(job.input_file_count !== undefined ||
            job.output_file_count !== undefined) && (
            <Box>
              <Typography sx={labelSx}>Files</Typography>
              <Typography sx={valueSx}>
                {job.input_file_count ?? 0} in / {job.output_file_count ?? 0}{' '}
                out
              </Typography>
            </Box>
          )}

          {/* CPU Hours */}
          {job.cpu_hours !== undefined && (
            <Box>
              <Typography sx={labelSx}>CPU</Typography>
              <Typography sx={valueSx}>
                {job.cpu_hours.toFixed(2)} hrs
              </Typography>
            </Box>
          )}

          {/* CPU Factor */}
          {job.cpu_factor !== undefined && (
            <Box>
              <Typography sx={labelSx}>CPU Factor</Typography>
              <Typography sx={valueSx}>{job.cpu_factor}x</Typography>
            </Box>
          )}

          {/* Max Memory */}
          {job.max_memory && (
            <Box>
              <Typography sx={labelSx}>Max Memory</Typography>
              <Typography sx={valueSx}>{job.max_memory}</Typography>
            </Box>
          )}
        </Box>

        {/* Job ID - full width */}
        <Box sx={{ mb: 0.75 }}>
          <Typography sx={labelSx}>Job ID</Typography>
          <Typography
            sx={{
              ...valueSx,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              fontSize: '0.65rem'
            }}
          >
            {job.id}
          </Typography>
        </Box>

        {/* Image details */}
        {job.image && (
          <Box sx={{ mb: 0.75 }}>
            <Typography sx={labelSx}>Image</Typography>
            <Typography
              sx={{
                ...valueSx,
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                wordBreak: 'break-all'
              }}
            >
              {job.image.name}
              {job.image.tag && `:${job.image.tag}`}
            </Typography>
            {job.image.digest && (
              <Typography
                sx={{
                  fontSize: '0.55rem',
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}
              >
                {job.image.digest}
              </Typography>
            )}
          </Box>
        )}

        {/* Error description */}
        {job.error && (
          <Box
            sx={{
              mb: 0.75,
              p: 0.5,
              bgcolor: 'error.main',
              borderRadius: 0.5,
              opacity: 0.9
            }}
          >
            <Typography
              sx={{
                fontSize: '0.65rem',
                color: 'error.contrastText',
                wordBreak: 'break-word'
              }}
            >
              {job.error}
            </Typography>
          </Box>
        )}

        {/* Outputs */}
        {job.outputs && job.outputs.length > 0 && (
          <Box sx={{ mb: 0.75 }}>
            <Typography sx={labelSx}>Outputs ({job.outputs.length})</Typography>
            <Box sx={{ pl: 0.5 }}>
              {job.outputs.slice(0, 5).map((output, index) => (
                <Box key={index} sx={{ py: 0.125 }}>
                  <Typography
                    sx={{
                      fontSize: '0.6rem',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}
                  >
                    {output.file}
                  </Typography>
                  {output.data_id && (
                    <Typography
                      sx={{
                        fontSize: '0.55rem',
                        color: 'text.secondary',
                        fontFamily: 'monospace'
                      }}
                    >
                      {output.data_id}
                    </Typography>
                  )}
                </Box>
              ))}
              {job.outputs.length > 5 && (
                <Typography
                  sx={{ fontSize: '0.55rem', color: 'text.secondary' }}
                >
                  ... and {job.outputs.length - 5} more
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Exit Codes (for terminal jobs) */}
        {isTerminalState(job.state) &&
          exitCodesQuery.data &&
          exitCodesQuery.data.length > 0 && (
            <Box sx={{ mb: 0.75 }}>
              <Typography sx={labelSx}>Exit Codes</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {exitCodesQuery.data.map(ec => (
                  <Chip
                    key={ec.container_num}
                    label={`Container ${ec.container_num}: ${ec.exit_code}`}
                    size="small"
                    color={ec.exit_code === 0 ? 'success' : 'error'}
                    variant="outlined"
                    sx={{
                      height: 16,
                      fontSize: '0.55rem',
                      '& .MuiChip-label': { px: 0.5 }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

        {/* State Transitions */}
        <Box sx={{ mb: 0.75 }}>
          <Typography sx={labelSx}>History</Typography>
          <StateTimeline transitions={job.transition_times || []} />
        </Box>

        {/* Log Viewer */}
        <LogViewer jobId={job.id} />
      </Box>
    </Box>
  );
};
