import { Injectable } from '@nestjs/common';
import { JobSourceAdapter } from '../interfaces/job-source.adapter';
import { NormalizedJob } from '../dto/normalized-job.dto';
import {
  extractSkills,
  inferSalaryCurrency,
  inferSeniority,
  isTechJob,
  parseSalary,
  stripHtml,
} from '../utils/job-normalization';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category?: string;
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
  tags?: string[];
}

@Injectable()
export class RemotiveAdapter implements JobSourceAdapter {
  async fetchJobs(config: Record<string, unknown>): Promise<NormalizedJob[]> {
    const url =
      (config.url as string) || 'https://remotive.com/api/remote-jobs';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'JobAggregatorBot/1.0' },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Remotive API returned ${response.status}`);
    }

    const payload = (await response.json()) as { jobs?: RemotiveJob[] };
    return (payload.jobs ?? [])
      .map((job) => this.normalize(job))
      .filter(isTechJob);
  }

  private normalize(job: RemotiveJob): NormalizedJob {
    const description = stripHtml(job.description ?? '');
    const skills = Array.from(
      new Set([...(job.tags ?? []), ...extractSkills(job.title, description)]),
    );
    const salary = parseSalary(job.salary ?? '');

    return {
      externalId: String(job.id),
      title: job.title,
      company: job.company_name,
      description,
      applyUrl: job.url,
      skills,
      seniority: inferSeniority(job.title),
      location: job.candidate_required_location || 'Worldwide',
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
      salaryCurrency: inferSalaryCurrency(
        job.salary ?? '',
        job.candidate_required_location,
      ),
      employmentType: job.job_type,
      isRemote: true,
      postedAt: job.publication_date
        ? new Date(job.publication_date)
        : new Date(),
    };
  }
}
