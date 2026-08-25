import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { calculateScore, MIN_FEED_SCORE } from './scoring.util';

export interface FeedItem {
  job: any;
  score: number;
  details: any;
}

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}
  async getFeed(
    userId: string,
    page: number,
    limit: number,
    filters: {
      remote?: boolean;
      seniority?: string[];
      location?: string;
      salaryMin?: number;
      salaryMax?: number;
    } = {},
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const version = (await this.redis.get(`feed:v:${userId}`)) || '1';

    // Build cache key that includes filters
    const filterKey = [
      filters.remote !== undefined ? `r${filters.remote}` : '',
      filters.seniority?.length ? `s${filters.seniority.sort().join('-')}` : '',
      filters.location ? `l${filters.location}` : '',
      filters.salaryMin !== undefined ? `min${filters.salaryMin}` : '',
      filters.salaryMax !== undefined ? `max${filters.salaryMax}` : '',
    ]
      .filter(Boolean)
      .join(':');

    const cacheKey = `feed:${userId}:v${version}:${filterKey || 'all'}:p${safePage}:l${safeLimit}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const allJobs = await this.prisma.job.findMany({
      where: { postedAt: { gte: thirtyDaysAgo } },
      orderBy: { postedAt: 'desc' },
    });

    // Apply filters BEFORE scoring
    let filteredJobs = allJobs;

    if (filters.remote !== undefined) {
      filteredJobs = filteredJobs.filter((j) => j.isRemote === filters.remote);
    }

    if (filters.seniority && filters.seniority.length > 0) {
      const normalized = filters.seniority.map((s) => s.toLowerCase());
      filteredJobs = filteredJobs.filter((j) =>
        normalized.includes(j.seniority?.toLowerCase() as string),
      );
    }
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      filteredJobs = filteredJobs.filter((j) =>
        j.location?.toLowerCase().includes(loc),
      );
    }

    if (filters.salaryMin !== undefined) {
      filteredJobs = filteredJobs.filter(
        (j) => j.salaryMax === null || j.salaryMax >= filters.salaryMin!,
      );
    }

    if (filters.salaryMax !== undefined) {
      filteredJobs = filteredJobs.filter(
        (j) => j.salaryMin === null || j.salaryMin <= filters.salaryMax!,
      );
    }

    // Score and filter by minimum score
    const scoredItems = filteredJobs
      .map((job) => {
        if (!profile) {
          return { job, score: 0, details: null };
        }
        const { score, details } = calculateScore(profile, job);
        return { job, score, details };
      })
      .filter((item) => {
        if (!profile) return true;
        return item.score >= MIN_FEED_SCORE;
      });

    // Sort: score desc, then recency desc
    scoredItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.job.postedAt.getTime() - a.job.postedAt.getTime();
    });

    // Paginate
    const skip = (safePage - 1) * safeLimit;
    const paginatedItems = scoredItems.slice(skip, skip + safeLimit);

    const result = {
      items: paginatedItems,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: scoredItems.length,
        totalPages: Math.ceil(scoredItems.length / safeLimit),
      },
    };

    await this.redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  }

  async findOne(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { source: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async invalidateFeedCache(userId: string): Promise<void> {
    await this.redis.incr(`feed:v:${userId}`);
  }
}
