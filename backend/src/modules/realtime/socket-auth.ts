import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as cookie from 'cookie';
import { ACCESS_COOKIE } from '../auth/cookies';

export function getUserFromHandshake(
  authHeader: string | undefined,
  jwt: JwtService,
  cfg: ConfigService,
  cookieHeader?: string | undefined
) {
  const cookies = cookie.parse(cookieHeader || '');
  const tokenFromCookie = cookies[ACCESS_COOKIE];

  const tokenFromHeader =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const token = tokenFromCookie || tokenFromHeader;
  if (!token) return null;

  try {
    const secret = cfg.get<string>('JWT_SECRET')!; 
    return jwt.verify(token, { secret }) as any;
  } catch {
    return null;
  }
}
