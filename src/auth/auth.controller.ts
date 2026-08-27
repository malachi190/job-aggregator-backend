import {
  Body,
  Controller,
  Headers,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { type User } from 'generated/prisma/client';
import type { Request, Response } from 'express';
import { RefreshCookieService } from './refresh-cookie.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshCookies: RefreshCookieService,
  ) {}

  private setPasswordSession(
    response: Response,
    result: Awaited<ReturnType<AuthService['login']>>,
  ) {
    const { refreshToken, ...publicResult } = result;
    this.refreshCookies.set(response, refreshToken);
    response.setHeader('Cache-Control', 'no-store');
    return publicResult;
  }

  @Post('register')
  @ResponseMessage('User created successfully')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(
      dto.email,
      dto.password,
      dto.fullName,
    );
    return this.setPasswordSession(response, result);
  }

  @Post('login')
  @ResponseMessage('Login successful')
  async login(
    @Body() dto: LoginDto,
    @Query('provider') provider: string,
    @Res({ passthrough: true }) response: Response,
    @Headers('authorization') authorization?: string,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    if (provider === 'password') {
      if (!dto.email || !dto.password) {
        throw new UnauthorizedException('Email and password are required');
      }
      const result = await this.authService.login(dto.email, dto.password);
      return this.setPasswordSession(response, result);
    }
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing Clerk session token');
    }
    return this.authService.loginWithClerkToken(token);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.refreshCookies.get(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.authService.refresh(refreshToken);
    return this.setPasswordSession(response, result);
  }

  @Post('logout')
  @ResponseMessage('Logout successful')
  @UseGuards(AuthGuard)
  logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.refreshCookies.clear(response);
    return this.authService.logout(user.id);
  }
}
