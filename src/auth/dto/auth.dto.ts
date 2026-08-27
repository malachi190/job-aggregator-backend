import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.email().optional(),
  password: z.string().min(1).optional(),
});

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
