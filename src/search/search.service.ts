import { Injectable } from '@nestjs/common';
import { calculateScore, MIN_FEED_SCORE } from 'src/feed/scoring.util';
import { PrismaService } from 'src/prisma/prisma.service';

export interface SearchQuery {
  userId: string;
  query: string;
  page: number;
  limit: number;
  remote?: boolean;
  seniority?: string[];
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
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
    const safeLimit = Math.max(1, Math.min(params.limit, 50));
    const safePage = Math.max(1, params.page);
    const skip = (safePage - 1) * safeLimit;

    const jobs = await this.prisma.job.findMany({
      where: { postedAt: { gte: thirtyDaysAgo } },
      orderBy: { postedAt: 'desc' },
    });

    const normalizedSeniorities = params.seniority?.map((value) =>
      value.toLowerCase(),
    );
    const location = params.location?.trim().toLowerCase();

    const matchingJobs = jobs.filter((job) => {
      const searchable = [
        job.title,
        job.company,
        job.description,
        ...job.skills,
      ]
        .join(' ')
        .toLowerCase();
      if (!keywords.every((keyword) => searchable.includes(keyword)))
        return false;
      if (params.remote !== undefined && job.isRemote !== params.remote)
        return false;
      if (
        normalizedSeniorities?.length &&
        !normalizedSeniorities.includes(job.seniority?.toLowerCase() ?? '')
      )
        return false;
      if (location && !job.location.toLowerCase().includes(location))
        return false;
      if (
        params.salaryMin !== undefined &&
        job.salaryMax !== null &&
        job.salaryMax < params.salaryMin
      )
        return false;
      if (
        params.salaryMax !== undefined &&
        job.salaryMin !== null &&
        job.salaryMin > params.salaryMax
      )
        return false;
      return true;
    });

    // After scoring:
    const scoredItems = matchingJobs
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

    const paginatedItems = scoredItems.slice(skip, skip + safeLimit);

    return {
      items: paginatedItems,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: scoredItems.length,
        totalPages: Math.ceil(scoredItems.length / safeLimit),
      },
    };
  }
}
