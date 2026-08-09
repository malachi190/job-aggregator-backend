import { Injectable } from '@nestjs/common';
import { calculateScore, MIN_FEED_SCORE } from 'src/feed/scoring.util';
import { PrismaService } from 'src/prisma/prisma.service';

export interface SearchQuery {
  userId: string;
  query: string;
  page: number;
  limit: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: SearchQuery) {
    const keywords = params.query
      .split(/\s+/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      const page = params.page;
      const limit = params.limit;
      return {
        items: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId: params.userId },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const safeLimit = Math.min(params.limit, 50);
    const skip = (params.page - 1) * safeLimit;

    // Build OR conditions for title search (case-insensitive)
    const titleConditions = keywords.map((keyword) => ({
      title: { contains: keyword, mode: 'insensitive' as const },
    }));

    const where = {
      postedAt: { gte: thirtyDaysAgo },
      OR: [...titleConditions, { skills: { hasSome: keywords } }],
    };

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { postedAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.job.count({ where }),
    ]);

    // After scoring:
    const scoredItems = jobs
      .map((job) => {
        if (!profile) return { job, score: 0, details: null };
        const { score, details } = calculateScore(profile, job);
        return { job, score, details };
      })
      .filter((item) => {
        if (!profile) return true;
        return item.score >= MIN_FEED_SCORE;
      });

    scoredItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.job.postedAt.getTime() - a.job.postedAt.getTime();
    });

    return {
      items: scoredItems,
      pagination: {
        page: params.page,
        limit: safeLimit,
        total: scoredItems.length,
        totalPages: Math.ceil(scoredItems.length / safeLimit),
      },
    };
  }
}
