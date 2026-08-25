jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { FeedService } from './feed.service';

describe('FeedService', () => {
  it('includes jobs that score below the former profile-match threshold', async () => {
    const job = {
      id: 'job-1',
      title: 'Backend Developer',
      skills: ['TypeScript'],
      seniority: 'senior',
      location: 'Lagos',
      isRemote: false,
      postedAt: new Date(),
    };
    const profile = {
      skills: ['Figma'],
      jobTitles: ['Product Designer'],
      seniority: 'junior',
      location: 'Abuja',
      remotePref: true,
    };
    const prisma = {
      profile: { findUnique: jest.fn().mockResolvedValue(profile) },
      job: { findMany: jest.fn().mockResolvedValue([job]) },
    };
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn(),
    };
    const service = new FeedService(prisma as never, redis as never);

    const result = await service.getFeed('user-1', 1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].job).toBe(job);
    expect(result.items[0].score).toBeLessThan(0.15);
    expect(result.pagination.total).toBe(1);
  });
});
