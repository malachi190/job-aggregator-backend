import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CreateApplicationDto extends createZodDto(
  z.object({ jobId: z.uuid() }),
) {}

export class UpdateApplicationStatusDto extends createZodDto(
  z.object({ status: z.enum(['PENDING', 'APPLIED', 'REJECTED', 'INTERVIEW']) }),
) {}
