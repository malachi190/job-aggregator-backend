import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type SourceType = 'API' | 'SCRAPE';
export type SourceRegion = 'INTERNATIONAL' | 'LOCAL';

export interface SourceData {
  name: string;
  type: SourceType;
  region: SourceRegion;
  url: string;
}

export interface UpdateSourceData {
  name?: string;
  type?: SourceType;
  region?: SourceRegion;
  url?: string;
}

@Injectable()
export class JobSourceService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchSources() {
    return this.prisma.jobSource.findMany();
  }

  async findOne(sourceId: string) {
    const source = await this.prisma.jobSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new NotFoundException('Job source not found');
    }

    return source;
  }

  async create(data: SourceData) {
    return this.prisma.jobSource.create({
      data: {
        name: data.name,
        type: data.type,
        region: data.region,
        config: {
          url: data.url,
        },
      },
    });
  }

  async update(sourceId: string, data: UpdateSourceData) {
    const existing = await this.prisma.jobSource.findUnique({
      where: { id: sourceId },
    });

    if (!existing) {
      throw new NotFoundException('Job source not found');
    }

    const updatePayload: any = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.region !== undefined) updatePayload.region = data.region;

    if (data.url !== undefined) {
      updatePayload.config = {
        ...(existing.config as Record<string, any>),
        url: data.url,
      };
    }

    return this.prisma.jobSource.update({
      where: { id: sourceId },
      data: updatePayload,
    });
  }

  async delete(sourceId: string) {
    const existing = await this.prisma.jobSource.findUnique({
      where: { id: sourceId },
      include: { jobs: { select: { id: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Job source not found');
    }

    if (existing.jobs.length > 0) {
      // Prevent deleting sources that have crawled jobs.
      // If you want cascade delete instead, remove this check.
      throw new Error(
        `Cannot delete source "${existing.name}" — it has ${existing.jobs.length} associated jobs. Delete those first.`,
      );
    }

    return this.prisma.jobSource.delete({
      where: { id: sourceId },
    });
  }
}
