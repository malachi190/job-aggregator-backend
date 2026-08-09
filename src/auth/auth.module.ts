import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { AuthGuard } from './guards/auth.guard';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { EnvService } from 'src/config/env.service';
import { TokenCleanupService } from './services/token-cleanup.service';

@Module({
  imports: [
    // PrismaModule,
    // ConfigModule,
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        secret: env.jwtAccessSecret,
        signOptions: {
          expiresIn: env.jwtAccessExpirySeconds,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtAuthGuard,
    ClerkAuthGuard,
    AuthGuard,
    PrismaService,
    TokenCleanupService,
  ],
  exports: [AuthService, AuthGuard, JwtAuthGuard, ClerkAuthGuard],
})
export class AuthModule {}
