import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRY_SECONDS: z.string().min(1).default('900'),
  JWT_REFRESH_EXPIRY_DAYS: z.string().min(1).default('30'),
  PORT: z.string().min(1).default('8080'),
  R2_ENDPOINT: z.url(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.url(),
  GEMINI_API_KEY: z.string().min(1),
  ERROR_LOG_PATH: z.string().min(1).default('logs/error.log'),
  ADMIN_EMAILS: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:3001'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(raw: NodeJS.ProcessEnv): EnvConfig {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}
