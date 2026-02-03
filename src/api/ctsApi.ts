/**
 * CTS API Client and React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CTS_API_BASE,
  POLLING_INTERVAL_ACTIVE,
  POLLING_INTERVAL_LIST,
  DEFAULT_JOB_LIMIT
} from '../config';
import {
  IJob,
  IJobStatus,
  IJobFilters,
  JobState,
  IExitCode,
  isTerminalState
} from '../types/jobs';
import { MOCK_JOBS, MOCK_LOGS, MOCK_EXIT_CODES } from './mockData';
import { getToken, isMockMode } from '../auth/token';

// API fetch helpers
async function fetchApi<T>(endpoint: string): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    // CTS API requires "Bearer <token>" format
    headers['Authorization'] = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }

  const response = await fetch(`${CTS_API_BASE}${endpoint}`, { headers });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function putApi<T>(endpoint: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }

  const response = await fetch(`${CTS_API_BASE}${endpoint}`, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function buildJobsQueryString(filters: IJobFilters): string {
  const params = new URLSearchParams();

  if (filters.state) {
    params.set('state', filters.state);
  }
  if (filters.after) {
    params.set('after', filters.after);
  }
  if (filters.before) {
    params.set('before', filters.before);
  }
  if (filters.cluster) {
    params.set('cluster', filters.cluster);
  }
  params.set('limit', String(filters.limit || DEFAULT_JOB_LIMIT));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// API response type - jobs endpoint returns object with jobs array
interface IJobsApiResponse {
  jobs: IJob[];
}

export async function fetchJobs(filters: IJobFilters = {}): Promise<IJob[]> {
  if (isMockMode()) {
    let jobs = [...MOCK_JOBS];

    if (filters.state) {
      jobs = jobs.filter(job => job.state === filters.state);
    }

    if (filters.cluster) {
      jobs = jobs.filter(job => job.cluster === filters.cluster);
    }

    return jobs.slice(0, filters.limit || DEFAULT_JOB_LIMIT);
  }

  const queryString = buildJobsQueryString(filters);
  const response = await fetchApi<IJobsApiResponse | IJob[]>(
    `/jobs/${queryString}`
  );

  // Handle both array and object response formats
  return Array.isArray(response) ? response : response.jobs;
}

export async function fetchJobDetail(jobId: string): Promise<IJob> {
  if (isMockMode()) {
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    return job;
  }

  return fetchApi<IJob>(`/jobs/${jobId}`);
}

export async function fetchJobStatus(jobId: string): Promise<IJobStatus> {
  if (isMockMode()) {
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    return { id: job.id, state: job.state };
  }

  return fetchApi<IJobStatus>(`/jobs/${jobId}/status`);
}

export async function cancelJob(jobId: string): Promise<IJob> {
  // Mock cancel - simulate state change
  if (isMockMode()) {
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    // Return job with canceling state (mock doesn't actually mutate)
    return { ...job, state: 'canceling' };
  }

  return putApi<IJob>(`/jobs/${jobId}/cancel`);
}

export async function fetchJobExitCodes(jobId: string): Promise<IExitCode[]> {
  if (isMockMode()) {
    return MOCK_EXIT_CODES[jobId] || [];
  }

  return fetchApi<IExitCode[]>(`/jobs/${jobId}/exit_codes`);
}

export async function fetchJobLog(
  jobId: string,
  containerNum: number,
  stream: 'stdout' | 'stderr'
): Promise<string> {
  if (isMockMode()) {
    const jobLogs = MOCK_LOGS[jobId];
    if (jobLogs && jobLogs[containerNum]) {
      return jobLogs[containerNum][stream] || '';
    }
    return '';
  }

  const token = getToken();
  const response = await fetch(
    `${CTS_API_BASE}/jobs/${jobId}/log/${containerNum}/${stream}`,
    {
      headers: token
        ? {
            Authorization: token.startsWith('Bearer ')
              ? token
              : `Bearer ${token}`
          }
        : {}
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

// React Query Hooks

export function useJobs(filters: IJobFilters = {}) {
  const token = getToken();
  return useQuery({
    queryKey: ['jobs', filters, token],
    queryFn: () => fetchJobs(filters),
    enabled: Boolean(token) || isMockMode(),
    refetchInterval: POLLING_INTERVAL_LIST,
    staleTime: 10000
  });
}

export function useJobDetail(jobId: string | null) {
  const token = getToken();
  return useQuery({
    queryKey: ['job', jobId, token],
    queryFn: () => fetchJobDetail(jobId!),
    enabled: Boolean(jobId) && (Boolean(token) || isMockMode()),
    staleTime: 5000
  });
}

export function useJobStatus(jobId: string | null, currentState?: JobState) {
  const token = getToken();
  const shouldPoll = currentState ? !isTerminalState(currentState) : true;

  return useQuery({
    queryKey: ['job-status', jobId, token],
    queryFn: () => fetchJobStatus(jobId!),
    enabled: Boolean(jobId) && (Boolean(token) || isMockMode()),
    refetchInterval: shouldPoll ? POLLING_INTERVAL_ACTIVE : false,
    staleTime: 2000
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => cancelJob(jobId),
    onSuccess: (data, jobId) => {
      // Invalidate job queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-status', jobId] });
    }
  });
}

export function useJobExitCodes(jobId: string | null, enabled = true) {
  const token = getToken();
  return useQuery({
    queryKey: ['job-exit-codes', jobId, token],
    queryFn: () => fetchJobExitCodes(jobId!),
    enabled: Boolean(jobId) && (Boolean(token) || isMockMode()) && enabled,
    staleTime: Infinity // Exit codes don't change
  });
}

export function useJobLog(
  jobId: string | null,
  containerNum: number,
  stream: 'stdout' | 'stderr',
  enabled = false
) {
  const token = getToken();
  return useQuery({
    queryKey: ['job-log', jobId, containerNum, stream, token],
    queryFn: () => fetchJobLog(jobId!, containerNum, stream),
    enabled: Boolean(jobId) && (Boolean(token) || isMockMode()) && enabled,
    staleTime: 30000 // Cache logs for 30 seconds
  });
}
