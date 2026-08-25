import { JobbermanAdapter } from './jobberman.adapter';
import { MyJobMagAdapter } from './myjobmag.adapter';
import { RemotiveAdapter } from './remotive.adapter';

describe('job source adapters', () => {
  afterEach(() => jest.restoreAllMocks());

  it('normalizes and filters Jobberman cards', async () => {
    const html = `
      <div data-cy="listing-cards-components" aria-labelledby="job-42-title">
        <a data-cy="listing-title-link" href="https://www.jobberman.com/listings/backend-developer-abc" title="Backend Developer"></a>
        <p class="text-blue-700">Acme Nigeria</p>
        <span class="bg-brand-secondary-100">Lagos</span>
        <span class="bg-brand-secondary-100">Full Time</span>
        <span class="bg-brand-secondary-100">NGN 300,000 - 500,000</span>
        <p class="md:pl-5">Build TypeScript APIs.</p>
        <div class="ml-auto"><p>2 days ago</p></div>
      </div>
      <div data-cy="listing-cards-components" aria-labelledby="job-43-title">
        <a data-cy="listing-title-link" href="https://www.jobberman.com/listings/sales-executive" title="Sales Executive"></a>
      </div>`;
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(html, { status: 200 }));

    const jobs = await new JobbermanAdapter().fetchJobs({});
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      externalId: '42',
      title: 'Backend Developer',
      company: 'Acme Nigeria',
      applyUrl: 'https://www.jobberman.com/listings/backend-developer-abc',
      salaryMin: 300_000,
      salaryMax: 500_000,
      salaryCurrency: 'NGN',
    });
  });

  it('separates MyJobMag titles from company names', async () => {
    const html = `
      <ul class="job-list"><li class="job-list-li"><ul>
        <li class="job-logo"><img alt="Finova logo"></li>
        <li class="job-info"><ul>
          <li><h2><a href="/job/backend-developer-finova">Backend Developer at Finova</a></h2></li>
          <li class="job-desc">Build secure Node.js services.</li>
          <li class="job-item"><span id="job-date">24 August <a href="/jobs-location/lagos">Lagos</a></span></li>
        </ul></li>
      </ul></li></ul>`;
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(html, { status: 200 }));

    const jobs = await new MyJobMagAdapter().fetchJobs({});
    expect(jobs[0]).toMatchObject({
      title: 'Backend Developer',
      company: 'Finova',
      location: 'Lagos',
      applyUrl: 'https://www.myjobmag.com/job/backend-developer-finova',
    });
  });

  it('normalizes Remotive jobs and drops non-technical roles', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      Response.json({
        jobs: [
          {
            id: 1,
            url: 'https://remotive.com/jobs/1',
            title: 'Senior Software Engineer',
            company_name: 'Acme',
            description: '<p>Build APIs with TypeScript.</p>',
            candidate_required_location: 'Worldwide',
            publication_date: '2026-08-20T12:00:00Z',
            salary: '$175k - $190k',
            tags: ['API'],
          },
          {
            id: 2,
            url: 'https://remotive.com/jobs/2',
            title: 'Account Executive',
            company_name: 'Acme',
          },
        ],
      }),
    );

    const jobs = await new RemotiveAdapter().fetchJobs({});
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      externalId: '1',
      description: 'Build APIs with TypeScript.',
      salaryMin: 175_000,
      salaryMax: 190_000,
      salaryCurrency: 'USD',
      isRemote: true,
    });
  });
});
