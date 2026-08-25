import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { JobSourceRegistry } from './registry/job-source.registry';
import { CrawlJobPayload } from './dto/crawl-job.payload';
import { deduplicateSkills, isTechJob } from './utils/job-normalization';

@Processor('crawler')
export class CrawlerProcessor extends WorkerHost {
  constructor(
    private readonly registry: JobSourceRegistry,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<CrawlJobPayload>): Promise<void> {
    const { sourceId } = job.data;

    const source = await this.prisma.jobSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`JobSource ${sourceId} not found`);
    }

    const adapter = this.registry.getAdapter(source.name);
    if (!adapter) {
      throw new Error(`No adapter registered for source: ${source.name}`);
    }

    const normalizedJobs = (
      await adapter.fetchJobs(source.config as Record<string, unknown>)
    )
      .filter(isTechJob)
      .map((normalized) => ({
        ...normalized,
        skills: deduplicateSkills(normalized.skills),
      }));

    for (const normalized of normalizedJobs) {
      try {
        await this.prisma.job.upsert({
          where: {
            sourceId_externalId: {
              sourceId: source.id,
              externalId: normalized.externalId,
            },
          },
          create: {
            sourceId: source.id,
            externalId: normalized.externalId,
            title: normalized.title,
            company: normalized.company,
            description: normalized.description,
            applyUrl: normalized.applyUrl,
            skills: normalized.skills,
            seniority: normalized.seniority,
            location: normalized.location,
            region: source.region,
            salaryMin: normalized.salaryMin,
            salaryMax: normalized.salaryMax,
            salaryCurrency: normalized.salaryCurrency,
            employmentType: normalized.employmentType,
            isRemote: normalized.isRemote,
            postedAt: normalized.postedAt,
          },
          update: {
            title: normalized.title,
            company: normalized.company,
            description: normalized.description,
            applyUrl: normalized.applyUrl,
            skills: normalized.skills,
            seniority: normalized.seniority,
            location: normalized.location,
            region: source.region,
            salaryMin: normalized.salaryMin,
            salaryMax: normalized.salaryMax,
            salaryCurrency: normalized.salaryCurrency,
            employmentType: normalized.employmentType,
            isRemote: normalized.isRemote,
            postedAt: normalized.postedAt,
          },
        });
      } catch (error) {
        console.error(
          `Failed to upsert job ${normalized.externalId} from ${source.name}:`,
          error,
        );
      }
    }

    console.log(
      `Crawl complete for ${source.name}: ${normalizedJobs.length} jobs processed`,
    );
  }
}
