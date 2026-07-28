import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from './token.service';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from 'generated/prisma/enums';
import { type User } from 'generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokens: TokenService,
  ) {}

  private async issueTokenPair(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.tokens.generateAccessToken(userId);
    const refreshToken = await this.tokens.issueRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  async register(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const exists = await this.prisma.user.findFirst({
      where: { email },
    });

    if (exists) {
      throw new ConflictException('Email alrady taken');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // create account
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        authProvider: AuthProvider.PASSWORD,
        profile: {
          create: {
            fullName,
            role: '',
            skills: [],
            seniority: '',
            location: '',
          },
        },
      },
    });

    const { accessToken, refreshToken } = await this.issueTokenPair(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.issueTokenPair(user.id);

    return { user, accessToken, refreshToken };
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const result = await this.tokens.rotateRefreshToken(rawRefreshToken);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.tokens.generateAccessToken(result.userId);
    return { accessToken, refreshToken: result.newRawToken };
  }

  async logout(userId: string) {
    await this.tokens.revokeAllforUser(userId);
  }

  async findOrCreateClerkUser(clerkId: string, email: string) {
    let user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (user) return user;

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingByEmail) {
      // Same person, previously registered via password — link Clerk to that account
      // rather than creating a duplicate.
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: { clerkId },
      });
    }

    return this.prisma.user.create({
      data: {
        clerkId,
        email,
        authProvider: AuthProvider.CLERK,
        profile: {
          create: {
            fullName: '',
            role: '',
            skills: [],
            seniority: '',
            location: '',
          },
        },
      },
    });
  }
}
