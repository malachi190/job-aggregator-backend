import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBaseCvSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.coerce.boolean().optional().default(false),
});

export class CreateBaseCvDto extends createZodDto(CreateBaseCvSchema) {}