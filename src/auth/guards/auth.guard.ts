import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ClerkAuthGuard } from './clerk-auth.guard';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtGuard: JwtAuthGuard,
    private clerkGuard: ClerkAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const provider = req.headers['x-auth-provider']; // 'clerk' | 'password'

    if (provider === 'clerk')
      return this.clerkGuard.canActivate(context) as Promise<boolean>;
    if (provider === 'password')
      return this.jwtGuard.canActivate(context) as Promise<boolean>;

    throw new BadRequestException('Missing or invalid x-auth-provider header');
  }
}
