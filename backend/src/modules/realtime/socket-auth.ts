// backend/src/modules/realtime/socket-auth.ts
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as cookie from 'cookie';
import { ACCESS_COOKIE } from '../auth/cookies';

/**
 * Vraća user payload iz:
 *  1) httpOnly cookie (ACCESS_COOKIE), ili
 *  2) Authorization: Bearer <token>
 * Ako ne može da verifikuje token, vraća null.
 */
export function getUserFromHandshake(
  authHeader: string | undefined,
  jwt: JwtService,
  cfg: ConfigService,
  cookieHeader?: string | undefined
) {
  // 1) probaj iz cookie-ja
  const cookies = cookie.parse(cookieHeader || '');
  const tokenFromCookie = cookies[ACCESS_COOKIE];

  // 2) fallback: Authorization
  const tokenFromHeader =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const token = tokenFromCookie || tokenFromHeader;
  if (!token) return null;

  try {
    const secret = cfg.get<string>('JWT_SECRET')!; // koristimo JEDAN key
    return jwt.verify(token, { secret }) as any;
  } catch {
    return null;
  }
}
