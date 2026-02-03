/**
 * CTS API Configuration
 */

import { PageConfig } from '@jupyterlab/coreutils';

// CTS API base URL
// Priority: PageConfig (from CDM_TASK_SERVICE_URL env) > default CI
export const CTS_API_BASE =
  PageConfig.getOption('ctsApiBase') || 'https://ci.kbase.us/services/cts';

// Polling intervals (in milliseconds)
export const POLLING_INTERVAL_ACTIVE = 5000; // 5 seconds for active jobs
export const POLLING_INTERVAL_LIST = 30000; // 30 seconds for job list

// API request defaults
export const DEFAULT_JOB_LIMIT = 100;

// UI limits
export const MAX_DISPLAYED_OUTPUTS = 5;
export const LOG_MAX_HEIGHT = 150;

// Auth
export const MOCK_TOKEN = 'mock-token';
