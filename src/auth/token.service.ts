import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';
import { EnvService } from 'src/config/env.service';

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private env: EnvService
  ) {}

  private generateRawRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // private parseDays(date: string): number {
  //    return parseInt(date, 10);
  // }

  generateAccessToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }

  async issueRefreshToken(userId: string): Promise<string> {
    const tokenTTL = this.env.jwtRefreshExpiryDays ?? '30';
    const rawToken = this.generateRawRefreshToken();
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + tokenTTL);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt,
      },
    });

    return rawToken;
  }

  // Rotate: validate old token, revokes it, issues a new one
  async rotateRefreshToken(
    raw: string,
  ): Promise<{ userId: string; newRawToken: string } | null> {
    const tokenHash = this.hashToken(raw);

    const exists = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });

    if (!exists || exists.expiresAt < new Date()) {
      return null;
    }

    await this.prisma.refreshToken.update({
      where: { id: exists.id },
      data: {
        revokedAt: new Date(),
      },
    });

    const newRawToken = await this.issueRefreshToken(exists.userId);

    return { userId: exists.userId, newRawToken };
  }

  async revokeAllforUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
