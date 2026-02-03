import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Paper,
  Collapse
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useJobLog } from '../api/ctsApi';

interface ILogViewerProps {
  jobId: string;
  containerCount?: number;
}

export const LogViewer: React.FC<ILogViewerProps> = ({
  jobId,
  containerCount = 1
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'stdout' | 'stderr'>('stdout');
  const [containerNum, setContainerNum] = useState(0);

  // Only fetch the active tab's logs when expanded
  const stdoutQuery = useJobLog(
    jobId,
    containerNum,
    'stdout',
    expanded && activeTab === 'stdout'
  );
  const stderrQuery = useJobLog(
    jobId,
    containerNum,
    'stderr',
    expanded && activeTab === 'stderr'
  );

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: 'stdout' | 'stderr'
  ) => {
    setActiveTab(newValue);
  };

  const handleContainerChange = (event: SelectChangeEvent<number>) => {
    setContainerNum(event.target.value as number);
  };

  const currentQuery = activeTab === 'stdout' ? stdoutQuery : stderrQuery;
  const logContent = currentQuery.data || '';

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderColor: 'divider'
      }}
    >
      {/* Header */}
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.75,
          py: 0.5,
          cursor: 'pointer',
          bgcolor: 'grey.50',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'grey.100'
          }
        }}
      >
        <FontAwesomeIcon
          icon={expanded ? faChevronDown : faChevronRight}
          style={{ fontSize: '0.55rem', opacity: 0.7 }}
        />
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
          Logs
        </Typography>
        {currentQuery.isLoading && (
          <CircularProgress size={10} sx={{ ml: 'auto' }} />
        )}
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 0.75 }}>
          {/* Controls */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.5
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                minHeight: 0,
                '& .MuiTabs-indicator': {
                  height: 1.5
                },
                '& .MuiTab-root': {
                  minHeight: 0,
                  py: 0.25,
                  px: 0.75,
                  fontSize: '0.6rem',
                  fontWeight: 500,
                  minWidth: 'auto',
                  textTransform: 'lowercase'
                }
              }}
            >
              <Tab label="stdout" value="stdout" />
              <Tab label="stderr" value="stderr" />
            </Tabs>

            {containerCount > 1 && (
              <FormControl size="small">
                <Select
                  value={containerNum}
                  onChange={handleContainerChange}
                  sx={{
                    fontSize: '0.6rem',
                    '& .MuiSelect-select': { py: 0.25, px: 0.5 }
                  }}
                >
                  {Array.from({ length: containerCount }, (_, i) => (
                    <MenuItem
                      key={i}
                      value={i}
                      sx={{ fontSize: '0.6rem', py: 0.25, minHeight: 0 }}
                    >
                      Container {i}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {/* Log Output */}
          <Paper
            variant="outlined"
            sx={{
              bgcolor: 'grey.900',
              color: 'grey.100',
              p: 0.75,
              maxHeight: 150,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              borderColor: 'grey.700'
            }}
          >
            {currentQuery.isLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 2
                }}
              >
                <CircularProgress size={14} sx={{ color: 'grey.500' }} />
              </Box>
            ) : currentQuery.error ? (
              <Typography sx={{ color: 'error.light', fontSize: '0.6rem' }}>
                Error loading logs: {currentQuery.error.message}
              </Typography>
            ) : logContent ? (
              logContent
            ) : (
              <Typography
                sx={{
                  color: 'grey.500',
                  fontSize: '0.6rem',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  py: 1
                }}
              >
                No {activeTab} output available
              </Typography>
            )}
          </Paper>
        </Box>
      </Collapse>
    </Paper>
  );
};
