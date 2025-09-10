import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ACCESS_COOKIE } from '../auth/cookies';


function extractAccessToken(req: Request): string | null {
  const fromCookie = (req as any).cookies?.[ACCESS_COOKIE];
  if (fromCookie) return fromCookie;

  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  return null;
}

@Injectable()
export class OperatorJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly cfg: ConfigService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();

    const token = extractAccessToken(req);
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const payload: any = await this.jwt.verifyAsync(token, {
        secret: this.cfg.get<string>('JWT_SECRET'),
      });

      if (payload?.role !== 'operator') {
        throw new UnauthorizedException('Operator role required');
      }

      (req as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
