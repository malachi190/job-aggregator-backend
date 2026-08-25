import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, applicationId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async create(userId: string, jobId: string) {
    const existing = await this.prisma.application.findFirst({
      where: { userId, jobId },
    });

    if (existing) {
      return this.findOne(userId, existing.id);
    }

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.application.create({
      data: {
        userId,
        jobId,
        status: 'PENDING',
      },
      include: { job: true },
    });
  }

  async updateStatus(
    userId: string,
    applicationId: string,
    status: ApplicationStatus,
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: { job: true },
    });
  }

  async delete(userId: string, applicationId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    await this.prisma.application.delete({ where: { id: applicationId } });
  }
}
