import { NormalizedJob } from '../dto/normalized-job.dto';

export interface JobSourceAdapter {
  fetchJobs(config: Record<string, unknown>): Promise<NormalizedJob[]>;
}