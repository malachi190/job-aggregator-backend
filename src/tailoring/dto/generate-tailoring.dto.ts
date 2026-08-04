import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GenerateTailoringSchema = z.object({
  baseCvId: z.uuid(),
  jobId: z.uuid(),
});

export class GenerateTailoringDto extends createZodDto(GenerateTailoringSchema) {}