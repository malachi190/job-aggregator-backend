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
export class MyJobMagAdapter implements JobSourceAdapter {
  async fetchJobs(config: Record<string, unknown>): Promise<NormalizedJob[]> {
    const url =
      (config.url as string) ||
      'https://www.myjobmag.com/jobs-by-field/information-technology';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'JobAggregatorBot/1.0' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`MyJobMag returned ${response.status}`);
    }

    const $ = load(await response.text());
    const jobs: NormalizedJob[] = [];

    $('.job-list > li.job-list-li').each((_, element) => {
      const card = $(element);
      const link = card.find('.job-info h2 a').first();
      const href = link.attr('href');
      const combinedTitle = normalizeWhitespace(link.text());
      if (!href || !combinedTitle) return;

      const companyFromLogo = normalizeWhitespace(
        card
          .find('.job-logo img')
          .attr('alt')
          ?.replace(/\s+logo$/i, '') ?? '',
      );
      const titleParts = combinedTitle.split(/\s+at\s+/i);
      const companyFromTitle = titleParts.length > 1 ? titleParts.pop() : '';
      const company = companyFromLogo || companyFromTitle || '';
      const title = titleParts.join(' at ') || combinedTitle;
      const description = normalizeWhitespace(card.find('.job-desc').text());
      const location =
        normalizeWhitespace(
          card.find('.job-item a[href^="/jobs-location/"]').first().text(),
        ) || 'Nigeria';
      const dateText = normalizeWhitespace(
        card
          .find('.job-item #job-date')
          .first()
          .clone()
          .children()
          .remove()
          .end()
          .text(),
      );
      const salaryText = card.find('.job-salary').first().text();
      const salary = parseSalary(salaryText);
      const skills = extractSkills(title, description);
      const applyUrl = new URL(href, 'https://www.myjobmag.com').toString();

      jobs.push({
        externalId: href.split('/').filter(Boolean).pop() || href,
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
        isRemote: /\b(?:remote|work from home)\b/i.test(
          `${title} ${description}`,
        ),
        postedAt: parseListingDate(dateText),
      });
    });

    return jobs.filter(isTechJob);
  }
}
