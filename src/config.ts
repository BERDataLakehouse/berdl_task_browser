/**
 * CTS API Configuration
 */

// Default to CI environment
// Can be overridden via window.__CTS_API_BASE__
export const CTS_API_BASE =
  (typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).__CTS_API_BASE__) ||
  'https://ci.kbase.us/services/cts';

// Polling intervals (in milliseconds)
export const POLLING_INTERVAL_ACTIVE = 5000; // 5 seconds for active jobs
export const POLLING_INTERVAL_LIST = 30000; // 30 seconds for job list

// API request defaults
export const DEFAULT_JOB_LIMIT = 100;
