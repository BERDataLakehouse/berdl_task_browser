/**
 * Date formatting utilities for job display
 */

import { IJob } from '../types/jobs';

/**
 * Format a timestamp as relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
export const formatRelativeTime = (isoString: string): string => {
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

/**
 * Get the last update time for a job based on its transition times
 */
export const getLastUpdateTime = (job: IJob): string => {
  if (job.transition_times && job.transition_times.length > 0) {
    const lastTransition =
      job.transition_times[job.transition_times.length - 1];
    return formatRelativeTime(lastTransition.time);
  }
  return '';
};
