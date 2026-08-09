import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokenCleanupService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });

    console.log(
      `[TokenCleanup] Deleted ${result.count} expired/revoked refresh tokens at ${new Date().toISOString()}`,
    );
  }
}
