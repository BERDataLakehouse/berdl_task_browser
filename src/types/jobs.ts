/**
 * CTS Job Types
 * Based on https://ci.kbase.us/services/cts/openapi.json
 */

/**
 * All possible job states as a const array for iteration
 */
export const JOB_STATES = [
  'created',
  'download_submitted',
  'job_submitting',
  'job_submitted',
  'upload_submitting',
  'upload_submitted',
  'complete',
  'error_processing_submitting',
  'error_processing_submitted',
  'error',
  'canceling',
  'canceled'
] as const;

export type JobState = (typeof JOB_STATES)[number];

export interface ITransitionTime {
  state: JobState;
  time: string; // ISO8601 timestamp
}

export interface IJobOutput {
  file: string;
  crc64nvme?: string;
}

export interface IJobImage {
  name: string;
  digest: string;
  entrypoint: string[];
  registered_by: string;
  registered_on: string;
  tag?: string;
  refdata_id?: string;
  default_refdata_mount_point?: string;
}

export interface ISite {
  cluster: string;
  nodes: number | null;
  cpus_per_node: number;
  memory_per_node_gb: number;
  max_runtime_min: number;
  notes: string[];
  active: boolean;
  available: boolean;
  unavailable_reason?: string;
}

export interface IJobInput {
  cluster: string;
  image: string;
  params?: Record<string, unknown>;
  num_containers?: number;
  cpus?: number;
  memory?: string;
  runtime?: number;
  input_roots?: string[];
  output_dir?: string;
  input_files?: string[];
}

export interface IJob {
  id: string;
  state: JobState;
  transition_times: ITransitionTime[];
  user: string;
  input_file_count?: number;
  output_file_count?: number;
  cpu_hours?: number;
  error?: string;
  outputs?: IJobOutput[];
  image?: IJobImage;
  job_input?: IJobInput;
  cpu_factor?: number;
  max_memory?: string;
  logpath?: string;
}

export interface IJobStatus {
  id: string;
  state: JobState;
}

export interface IJobsResponse {
  jobs: IJob[];
}

export interface IJobFilters {
  state?: JobState;
  after?: string;
  before?: string;
  limit?: number;
  cluster?: string;
}

export interface IExitCode {
  container_num: number;
  exit_code: number;
}

// Helper to determine if a job is in a terminal state
export const isTerminalState = (state: JobState): boolean => {
  return state === 'complete' || state === 'error' || state === 'canceled';
};

// Helper to determine if a job is in an error state
export const isErrorState = (state: JobState): boolean => {
  return state === 'error' || state.startsWith('error_');
};

// Helper to determine if a job can be canceled
export const isCancelableState = (state: JobState): boolean => {
  return !isTerminalState(state) && state !== 'canceling';
};
