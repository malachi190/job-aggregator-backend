import { Injectable } from '@nestjs/common';
import { JobSourceAdapter } from '../interfaces/job-source.adapter';
import { NormalizedJob } from '../dto/normalized-job.dto';

@Injectable()
export class RemoteOkAdapter implements JobSourceAdapter {
  async fetchJobs(config: Record<string, unknown>): Promise<NormalizedJob[]> {
    const url = (config.url as string) || 'https://remoteok.com/api';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JobAggregatorBot/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`RemoteOK API returned ${response.status}`);
    }

    const data = await response.json();

    // RemoteOK returns an array; filter out any non-job entries (e.g. legal meta)
    const rawJobs = Array.isArray(data)
      ? data.filter((item: any) => item && typeof item.id !== 'undefined')
      : [];

    return rawJobs.map((item: any) => this.normalize(item));
  }

  private normalize(item: any): NormalizedJob {
    const title = item.position || item.title || 'Unknown Title';
    const location = item.location || 'Anywhere';

    return {
      externalId: String(item.id),
      title,
      company: item.company || 'Unknown Company',
      description: item.description || '',
      skills: Array.isArray(item.tags) ? item.tags : [],
      seniority: this.inferSeniority(title),
      location,
      salaryMin: item.salary_min ? Number(item.salary_min) : undefined,
      salaryMax: item.salary_max ? Number(item.salary_max) : undefined,
      employmentType: item.employment_type || undefined,
      isRemote: location === 'Anywhere' || /remote/i.test(location),
      postedAt: item.date ? new Date(item.date) : new Date(),
    };
  }

  private inferSeniority(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('senior') || t.includes('sr.')) return 'senior';
    if (t.includes('lead') || t.includes('principal') || t.includes('staff'))
      return 'lead';
    if (t.includes('junior') || t.includes('jr.')) return 'junior';
    if (t.includes('intern')) return 'intern';
    return 'mid';
  }
}
