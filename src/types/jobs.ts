/**
 * CTS Job Types
 * Based on https://ci.kbase.us/services/cts/openapi.json
 */

export type JobState =
  | 'created'
  | 'download_submitted'
  | 'job_submitting'
  | 'job_submitted'
  | 'upload_submitting'
  | 'upload_submitted'
  | 'complete'
  | 'error_processing_submitting'
  | 'error_processing_submitted'
  | 'error'
  | 'canceling'
  | 'canceled';

export interface ITransitionTime {
  state: JobState;
  time: string; // ISO8601 timestamp
}

export interface IJobOutput {
  file: string;
  data_id?: string;
  crc64nvme?: string;
}

export interface IJobImage {
  name: string;
  digest?: string;
  tag?: string;
  entrypoint?: string;
  refdata_id?: string;
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
  job_input?: string;
  cpu_factor?: number;
  max_memory?: string;
  logpath?: string;
  cleaned?: boolean;
  admin_meta?: Record<string, unknown>;
  cluster?: string;
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
