import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RefineTailoringSchema = z.object({
  feedback: z.string().min(1).max(2000),
});

export class RefineTailoringDto extends createZodDto(RefineTailoringSchema) {}