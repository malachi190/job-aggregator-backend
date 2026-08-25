import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedJobsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.savedJob.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async save(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    return this.prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: { userId, jobId },
      update: {},
      include: { job: true },
    });
  }

  async remove(userId: string, jobId: string) {
    await this.prisma.savedJob.deleteMany({ where: { userId, jobId } });
  }
}
