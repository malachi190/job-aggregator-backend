import { Inject, Injectable } from '@nestjs/common';
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

  async getFeed(userId: string, page: number, limit: number) {
    const version = (await this.redis.get(`feed:v:${userId}`)) || '1';
    const cacheKey = `feed:${userId}:v${version}:p${page}:l${limit}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all active jobs from last 30 days
    const allJobs = await this.prisma.job.findMany({
      where: { postedAt: { gte: thirtyDaysAgo } },
      orderBy: { postedAt: 'desc' },
    });

    // Score and filter — only keep jobs that actually match
    const scoredItems = allJobs
      .map((job) => {
        if (!profile) {
          return { job, score: 0, details: null };
        }
        const { score, details } = calculateScore(profile, job);
        return { job, score, details };
      })
      .filter((item) => {
        if (!profile) return true; // unauthenticated/guest sees everything
        return item.score >= MIN_FEED_SCORE;
      });

    // Sort: score desc, then recency desc
    scoredItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.job.postedAt.getTime() - a.job.postedAt.getTime();
    });

    // Manual pagination after filtering/sorting
    const safeLimit = Math.min(limit, 50);
    const skip = (page - 1) * safeLimit;
    const paginatedItems = scoredItems.slice(skip, skip + safeLimit);

    const result = {
      items: paginatedItems,
      pagination: {
        page,
        limit: safeLimit,
        total: scoredItems.length,
        totalPages: Math.ceil(scoredItems.length / safeLimit),
      },
    };

    await this.redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  }

  async invalidateFeedCache(userId: string): Promise<void> {
    await this.redis.incr(`feed:v:${userId}`);
  }
}
