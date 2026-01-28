import { IJob, IExitCode, JobState } from '../types/jobs';

// Helper to create timestamps relative to now
const minutesAgo = (minutes: number): string => {
  const date = new Date(Date.now() - minutes * 60 * 1000);
  return date.toISOString();
};

// Create transition times for a job
const createTransitionTimes = (
  states: { state: JobState; timeAgo: number }[]
): IJob['transition_times'] => {
  return states.map(s => ({
    state: s.state,
    time: minutesAgo(s.timeAgo)
  }));
};

export const MOCK_JOBS: IJob[] = [
  {
    id: 'job-a1b2c3d4-running-analysis',
    state: 'job_submitted',
    user: 'testuser',
    input_file_count: 5,
    output_file_count: 0,
    cluster: 'perlmutter',
    image: {
      name: 'kbase/analysis-tool',
      tag: 'v1.2.3',
      entrypoint: '/app/run.sh'
    },
    job_input: '{"param1": "value1", "param2": 42}',
    cpu_factor: 1.0,
    max_memory: '8Gi',
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 15 },
      { state: 'download_submitted', timeAgo: 14 },
      { state: 'job_submitting', timeAgo: 10 },
      { state: 'job_submitted', timeAgo: 8 }
    ])
  },
  {
    id: 'job-e5f6g7h8-completed-successfully',
    state: 'complete',
    user: 'testuser',
    input_file_count: 3,
    output_file_count: 12,
    cpu_hours: 2.45,
    cluster: 'perlmutter',
    image: {
      name: 'kbase/genome-assembler',
      tag: 'v2.0.0',
      digest: 'sha256:abc123def456',
      entrypoint: '/usr/bin/assemble'
    },
    outputs: [
      { file: 'assembly.fasta', data_id: 'ws/123/1', crc64nvme: 'abc123' },
      { file: 'stats.json', data_id: 'ws/123/2' },
      { file: 'log.txt' }
    ],
    logpath: '/logs/job-e5f6g7h8/',
    cleaned: false,
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 180 },
      { state: 'download_submitted', timeAgo: 178 },
      { state: 'job_submitting', timeAgo: 175 },
      { state: 'job_submitted', timeAgo: 170 },
      { state: 'upload_submitting', timeAgo: 65 },
      { state: 'upload_submitted', timeAgo: 62 },
      { state: 'complete', timeAgo: 60 }
    ])
  },
  {
    id: 'job-i9j0k1l2-failed-with-error',
    state: 'error',
    user: 'testuser',
    input_file_count: 8,
    output_file_count: 0,
    cpu_hours: 0.12,
    cluster: 'lawrencium',
    image: {
      name: 'kbase/memory-intensive',
      tag: 'latest'
    },
    error:
      'Container exited with non-zero status: OutOfMemoryError - Java heap space exceeded. Consider increasing memory allocation or reducing input size.',
    max_memory: '4Gi',
    cleaned: true,
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 240 },
      { state: 'download_submitted', timeAgo: 238 },
      { state: 'job_submitting', timeAgo: 235 },
      { state: 'job_submitted', timeAgo: 230 },
      { state: 'error', timeAgo: 220 }
    ])
  },
  {
    id: 'job-m3n4o5p6-uploading-results',
    state: 'upload_submitted',
    user: 'testuser',
    input_file_count: 2,
    output_file_count: 47,
    cpu_hours: 5.78,
    cluster: 'kbase',
    image: {
      name: 'kbase/batch-processor',
      tag: 'v3.1.0'
    },
    cpu_factor: 2.0,
    max_memory: '16Gi',
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 400 },
      { state: 'download_submitted', timeAgo: 398 },
      { state: 'job_submitting', timeAgo: 395 },
      { state: 'job_submitted', timeAgo: 390 },
      { state: 'upload_submitting', timeAgo: 25 },
      { state: 'upload_submitted', timeAgo: 22 }
    ])
  },
  {
    id: 'job-q7r8s9t0-just-created',
    state: 'created',
    user: 'testuser',
    input_file_count: 1,
    output_file_count: 0,
    cluster: 'perlmutter',
    image: {
      name: 'kbase/quick-analysis',
      tag: 'v1.0.0'
    },
    transition_times: createTransitionTimes([{ state: 'created', timeAgo: 2 }])
  },
  {
    id: 'job-u1v2w3x4-downloading',
    state: 'download_submitted',
    user: 'testuser',
    input_file_count: 15,
    output_file_count: 0,
    cluster: 'lawrencium',
    image: {
      name: 'kbase/data-processor',
      tag: 'v2.5.0'
    },
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 5 },
      { state: 'download_submitted', timeAgo: 4 }
    ])
  },
  {
    id: 'job-y5z6a7b8-old-complete',
    state: 'complete',
    user: 'testuser',
    input_file_count: 4,
    output_file_count: 8,
    cpu_hours: 1.23,
    cluster: 'kbase',
    image: {
      name: 'kbase/legacy-tool',
      tag: 'v0.9.0'
    },
    outputs: [
      { file: 'result1.txt', data_id: 'ws/456/1' },
      { file: 'result2.txt', data_id: 'ws/456/2' }
    ],
    cleaned: true,
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 1500 },
      { state: 'download_submitted', timeAgo: 1498 },
      { state: 'job_submitting', timeAgo: 1495 },
      { state: 'job_submitted', timeAgo: 1490 },
      { state: 'upload_submitting', timeAgo: 1450 },
      { state: 'upload_submitted', timeAgo: 1448 },
      { state: 'complete', timeAgo: 1440 }
    ])
  },
  {
    id: 'job-c9d0e1f2-error-processing',
    state: 'error_processing_submitted',
    user: 'testuser',
    input_file_count: 6,
    output_file_count: 3,
    cpu_hours: 0.89,
    cluster: 'perlmutter',
    image: {
      name: 'kbase/error-handler',
      tag: 'v1.1.0'
    },
    error:
      'Partial failure during output processing. Some results may be available.',
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 90 },
      { state: 'download_submitted', timeAgo: 88 },
      { state: 'job_submitting', timeAgo: 85 },
      { state: 'job_submitted', timeAgo: 80 },
      { state: 'error_processing_submitting', timeAgo: 35 },
      { state: 'error_processing_submitted', timeAgo: 32 }
    ])
  },
  {
    id: 'job-d1e2f3g4-canceling',
    state: 'canceling',
    user: 'testuser',
    input_file_count: 10,
    output_file_count: 0,
    cpu_hours: 0.5,
    cluster: 'lawrencium',
    image: {
      name: 'kbase/long-running',
      tag: 'v4.0.0'
    },
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 60 },
      { state: 'download_submitted', timeAgo: 58 },
      { state: 'job_submitting', timeAgo: 55 },
      { state: 'job_submitted', timeAgo: 50 },
      { state: 'canceling', timeAgo: 5 }
    ])
  },
  {
    id: 'job-h5i6j7k8-canceled',
    state: 'canceled',
    user: 'testuser',
    input_file_count: 7,
    output_file_count: 0,
    cpu_hours: 0.25,
    cluster: 'kbase',
    image: {
      name: 'kbase/optional-analysis',
      tag: 'v2.0.0'
    },
    cleaned: true,
    transition_times: createTransitionTimes([
      { state: 'created', timeAgo: 120 },
      { state: 'download_submitted', timeAgo: 118 },
      { state: 'job_submitting', timeAgo: 115 },
      { state: 'job_submitted', timeAgo: 110 },
      { state: 'canceling', timeAgo: 100 },
      { state: 'canceled', timeAgo: 95 }
    ])
  }
];

// Mock log data by job ID -> container num -> stream
export const MOCK_LOGS: Record<
  string,
  Record<number, { stdout?: string; stderr?: string }>
> = {
  'job-e5f6g7h8-completed-successfully': {
    0: {
      stdout: `[2024-01-15 10:30:00] Starting genome assembly...
[2024-01-15 10:30:01] Loading input files...
[2024-01-15 10:30:05] Input validation complete
[2024-01-15 10:30:10] Running assembly algorithm...
[2024-01-15 10:35:00] Assembly complete
[2024-01-15 10:35:01] Writing output files...
[2024-01-15 10:35:05] Job finished successfully`,
      stderr: `[WARN] Low memory detected, using conservative settings
[INFO] Using 4 threads for parallel processing`
    }
  },
  'job-i9j0k1l2-failed-with-error': {
    0: {
      stdout: `[2024-01-15 08:00:00] Starting analysis...
[2024-01-15 08:00:01] Loading large dataset...
[2024-01-15 08:05:00] Processing batch 1 of 10...`,
      stderr: `[ERROR] OutOfMemoryError: Java heap space
[ERROR] at java.util.Arrays.copyOf(Arrays.java:3210)
[ERROR] at java.util.ArrayList.grow(ArrayList.java:265)
[ERROR] Job terminated due to memory exhaustion`
    }
  },
  'job-a1b2c3d4-running-analysis': {
    0: {
      stdout: `[2024-01-15 12:00:00] Initializing analysis pipeline...
[2024-01-15 12:00:05] Downloading input data...
[2024-01-15 12:01:00] Starting main computation...`,
      stderr: ''
    }
  }
};

// Mock exit codes by job ID
export const MOCK_EXIT_CODES: Record<string, IExitCode[]> = {
  'job-e5f6g7h8-completed-successfully': [{ container_num: 0, exit_code: 0 }],
  'job-i9j0k1l2-failed-with-error': [{ container_num: 0, exit_code: 137 }],
  'job-h5i6j7k8-canceled': [{ container_num: 0, exit_code: 143 }]
};
