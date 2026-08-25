import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { email?: string } }>();
    const user = request.user;
    if (
      user?.email &&
      this.env.adminEmails.includes(user.email.toLowerCase())
    ) {
      return true;
    }
    throw new ForbiddenException('Admin access required');
  }
}
