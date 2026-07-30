import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { calculateScore } from './scoring.util';

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
    const safeLimit = Math.min(limit, 50);
    const skip = (page - 1) * safeLimit;

    const total = await this.prisma.job.count({
      where: { postedAt: { gte: thirtyDaysAgo } },
    });

    const jobs = await this.prisma.job.findMany({
      where: { postedAt: { gte: thirtyDaysAgo } },
      orderBy: { postedAt: 'desc' },
      skip,
      take: safeLimit,
    });

    const scoredItems = jobs.map((job) => {
      if (!profile) {
        return { job, score: 0, details: null };
      }
      const { score, details } = calculateScore(profile, job);
      return { job, score, details };
    });

    // Primary: recency desc. Secondary: score desc.
    scoredItems.sort((a, b) => {
      const dateDiff = b.job.postedAt.getTime() - a.job.postedAt.getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.score - a.score;
    });

    const result = {
      items: scoredItems,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };

    await this.redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  }

  async invalidateFeedCache(userId: string): Promise<void> {
    await this.redis.incr(`feed:v:${userId}`);
  }
}
