import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { verifyToken } from '@clerk/backend';
import { EnvService } from 'src/config/env.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private env: EnvService,
  ) {}

  private extractToken(req: any): string | null {
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice(7);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const verified = await verifyToken(token, {
        secretKey: this.env.clerkSecretKey,
      });

      const clerkId = verified.sub;
      const email = (verified as any).email ?? '';

      const user = await this.authService.findOrCreateClerkUser(clerkId, email);
      req.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Clerk session');
    }
  }
}
