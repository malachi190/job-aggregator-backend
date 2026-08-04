import { Injectable } from '@nestjs/common';
import { EnvConfig, validateEnv } from './env.validation';

@Injectable()
export class EnvService {
  private readonly config: EnvConfig;

  constructor() {
    this.config = validateEnv(process.env);
  }

  get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.config.REDIS_URL;
  }

  get clerkSecretKey(): string {
    return this.config.CLERK_SECRET_KEY;
  }

  get clerkPublishableKey(): string {
    return this.config.CLERK_PUBLISHABLE_KEY;
  }

  get jwtAccessSecret(): string {
    return this.config.JWT_ACCESS_SECRET;
  }

  get jwtRefreshSecret(): string {
    return this.config.JWT_REFRESH_SECRET;
  }

  get jwtAccessExpirySeconds(): number {
    return parseInt(this.config.JWT_ACCESS_EXPIRY_SECONDS, 10);
  }

  get jwtRefreshExpiryDays(): number {
    return parseInt(this.config.JWT_REFRESH_EXPIRY_DAYS, 10);
  }

  get port(): number {
    return parseInt(this.config.PORT, 10);
  }

  get r2Endpoint(): string {
    return this.config.R2_ENDPOINT;
  }

  get r2AccessKeyId(): string {
    return this.config.R2_ACCESS_KEY_ID;
  }

  get r2SecretAccessKey(): string {
    return this.config.R2_SECRET_ACCESS_KEY;
  }

  get r2BucketName(): string {
    return this.config.R2_BUCKET_NAME;
  }

  get r2PublicUrl(): string {
    return this.config.R2_PUBLIC_URL;
  }

  get geminiApiKey(): string {
    return this.config.GEMINI_API_KEY;
  }
}
