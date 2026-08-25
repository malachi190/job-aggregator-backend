import {
  Body,
  Controller,
  Headers,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { type User } from 'generated/prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ResponseMessage('User created successfully')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(
      dto.email,
      dto.password,
      dto.fullName,
    );
  }

  @Post('login')
  @ResponseMessage('Login successful')
  async login(
    @Body() dto: LoginDto,
    @Query('provider') provider: string,
    @Headers('authorization') authorization?: string,
  ) {
    if (provider === 'password') {
      if (!dto.email || !dto.password) {
        throw new UnauthorizedException('Email and password are required');
      }
      return await this.authService.login(dto.email, dto.password);
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
  async refresh(@Body() dto: RefreshDto) {
    return await this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ResponseMessage('Logout successful')
  @UseGuards(AuthGuard)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }
}
