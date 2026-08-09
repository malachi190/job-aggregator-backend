import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { type User } from 'generated/prisma/client';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from 'src/rate-limit/rate-limit.config';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ auth: RATE_LIMITS.auth })
  @ResponseMessage('User created successfully')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(
      dto.email,
      dto.password,
      dto.fullName,
    );
  }

  @Post('login')
  @Throttle({ auth: RATE_LIMITS.auth })
  @ResponseMessage('Login successful')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @Throttle({ auth: RATE_LIMITS.auth })
  async refresh(@Body() dto: RefreshDto) {
    return await this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @Throttle({ auth: RATE_LIMITS.auth })
  @ResponseMessage('Logout successful')
  @UseGuards(AuthGuard)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }
}
