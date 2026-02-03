/**
 * MSW request handlers for CTS API mocking
 */

import { http, HttpResponse } from 'msw';
import { CTS_API_BASE, DEFAULT_JOB_LIMIT } from '../config';
import {
  MOCK_JOBS,
  MOCK_LOGS,
  MOCK_EXIT_CODES_API,
  MOCK_SITES
} from '../api/mockData';

export const handlers = [
  // List sites
  http.get(`${CTS_API_BASE}/sites/`, () => {
    return HttpResponse.json({ sites: MOCK_SITES });
  }),

  // List jobs
  http.get(`${CTS_API_BASE}/jobs/`, ({ request }) => {
    const url = new URL(request.url);
    const state = url.searchParams.get('state');
    const cluster = url.searchParams.get('cluster');
    const limit = parseInt(url.searchParams.get('limit') || '', 10);

    let jobs = [...MOCK_JOBS];

    if (state) {
      jobs = jobs.filter(j => j.state === state);
    }

    if (cluster) {
      jobs = jobs.filter(j => j.job_input?.cluster === cluster);
    }

    const finalLimit = isNaN(limit) ? DEFAULT_JOB_LIMIT : limit;
    jobs = jobs.slice(0, finalLimit);

    return HttpResponse.json({ jobs });
  }),

  // Get single job
  http.get(`${CTS_API_BASE}/jobs/:jobId`, ({ params }) => {
    const job = MOCK_JOBS.find(j => j.id === params.jobId);
    if (!job) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(job);
  }),

  // Get job status
  http.get(`${CTS_API_BASE}/jobs/:jobId/status`, ({ params }) => {
    const job = MOCK_JOBS.find(j => j.id === params.jobId);
    if (!job) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ id: job.id, state: job.state });
  }),

  // Cancel job
  http.put(`${CTS_API_BASE}/jobs/:jobId/cancel`, ({ params }) => {
    const job = MOCK_JOBS.find(j => j.id === params.jobId);
    if (!job) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ ...job, state: 'canceling' });
  }),

  // Get exit codes
  http.get(`${CTS_API_BASE}/jobs/:jobId/exit_codes`, ({ params }) => {
    const jobId = params.jobId as string;
    const exitCodes = MOCK_EXIT_CODES_API[jobId] || { exit_codes: [] };
    return HttpResponse.json(exitCodes);
  }),

  // Get job log
  http.get(
    `${CTS_API_BASE}/jobs/:jobId/log/:containerNum/:stream`,
    ({ params }) => {
      const jobId = params.jobId as string;
      const containerNum = parseInt(params.containerNum as string, 10);
      const stream = params.stream as 'stdout' | 'stderr';

      const jobLogs = MOCK_LOGS[jobId];
      if (jobLogs && jobLogs[containerNum]) {
        const content = jobLogs[containerNum][stream] || '';
        return new HttpResponse(content, {
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      return new HttpResponse('', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  )
];
