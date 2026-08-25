import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { JobSourceAdapter } from '../interfaces/job-source.adapter';
import { NormalizedJob } from '../dto/normalized-job.dto';
import {
  extractSkills,
  inferSalaryCurrency,
  inferSeniority,
  isTechJob,
  normalizeWhitespace,
  parseListingDate,
  parseSalary,
} from '../utils/job-normalization';

@Injectable()
export class JobbermanAdapter implements JobSourceAdapter {
  async fetchJobs(config: Record<string, unknown>): Promise<NormalizedJob[]> {
    const url =
      (config.url as string) || 'https://www.jobberman.com/jobs/software-data';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'JobAggregatorBot/1.0' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`Jobberman returned ${response.status}`);
    }

    const $ = load(await response.text());
    const jobs: NormalizedJob[] = [];

    $('[data-cy="listing-cards-components"]').each((_, element) => {
      const card = $(element);
      const link = card.find('[data-cy="listing-title-link"]').first();
      const applyUrl = link.attr('href');
      const title = normalizeWhitespace(link.attr('title') || link.text());
      if (!applyUrl || !title) return;

      const id =
        card.attr('aria-labelledby')?.match(/job-(\d+)-title/)?.[1] ||
        applyUrl.split('/').filter(Boolean).pop();
      if (!id) return;

      const company = normalizeWhitespace(
        card.find('p.text-blue-700').first().text(),
      );
      const description = normalizeWhitespace(
        card.find('p[class*="md:pl-5"]').first().text(),
      );
      const badges = card
        .find('span.bg-brand-secondary-100')
        .map((__, badge) => normalizeWhitespace($(badge).text()))
        .get();
      const [location = 'Nigeria', employmentType, salaryText = ''] = badges;
      const postedText = normalizeWhitespace(
        card.find('.ml-auto p').last().text(),
      );
      const salary = parseSalary(salaryText);
      const skills = extractSkills(title, description);

      jobs.push({
        externalId: id,
        title,
        company: company || 'Undisclosed company',
        description,
        applyUrl,
        skills,
        seniority: inferSeniority(title),
        location,
        salaryMin: salary.salaryMin,
        salaryMax: salary.salaryMax,
        salaryCurrency: inferSalaryCurrency(salaryText, location, 'NGN'),
        employmentType,
        isRemote: /\bremote\b/i.test(`${location} ${description}`),
        postedAt: parseListingDate(postedText),
      });
    });

    return jobs.filter(isTechJob);
  }
}
