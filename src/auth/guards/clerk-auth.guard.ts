import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from 'generated/prisma/client';
import { AuthService } from '../auth.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  private extractToken(req: Request): string | null {
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice(7);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: User }>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const user = await this.authService.authenticateClerkToken(token);
      req.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Clerk session');
    }
  }
}
