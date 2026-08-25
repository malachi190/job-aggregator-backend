import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateProfileSchema = z
  .object({
    fullName: z.string().min(1).max(100).optional(),
    role: z.string().min(1).max(100).optional(),
    skills: z.array(z.string().min(1).max(50)).max(50).optional(),
    jobTitles: z.array(z.string().min(1).max(100)).max(20).optional(),
    seniority: z.string().min(1).max(50).optional(),
    location: z.string().min(1).max(100).optional(),
    remotePref: z.boolean().optional(),
    salaryMin: z.number().int().min(0).nullable().optional(),
    salaryMax: z.number().int().min(0).nullable().optional(),
  })
  .refine(
    (data) => {
      if (
        data.salaryMin !== undefined &&
        data.salaryMin !== null &&
        data.salaryMax !== undefined &&
        data.salaryMax !== null
      ) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: 'salaryMax must be greater than or equal to salaryMin',
      path: ['salaryMax'],
    },
  );

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
