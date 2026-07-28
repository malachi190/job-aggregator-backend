import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateByUserId(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: dto.fullName ?? '',
        role: dto.role ?? '',
        skills: dto.skills ?? [],
        jobTitles: dto.jobTitles ?? [],
        seniority: dto.seniority ?? '',
        location: dto.location ?? '',
        remotePref: dto.remotePref ?? true,
        salaryMin: dto.salaryMin ?? null,
        salaryMax: dto.salaryMax ?? null,
      },
      update: {
        fullName: dto.fullName,
        role: dto.role,
        skills: dto.skills,
        jobTitles: dto.jobTitles,
        seniority: dto.seniority,
        location: dto.location,
        remotePref: dto.remotePref,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
      },
    });

    return profile;
  }

  async deleteByUserId(userId: string) {
    await this.prisma.profile.delete({
      where: { userId },
    });
  }
}
