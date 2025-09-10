import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ACCESS_COOKIE } from '../auth/cookies';

@Injectable()
export class PlayerJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();

    const tokenFromCookie = req.cookies?.[ACCESS_COOKIE];

    const tokenFromHeader = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;

    const token = tokenFromCookie || tokenFromHeader;
    if (!token) throw new UnauthorizedException('Missing access token');

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.cfg.get<string>('JWT_SECRET')!,
      });

      if (payload.role !== 'player') {
        throw new UnauthorizedException('Player token required');
      }

      (req as any).user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
