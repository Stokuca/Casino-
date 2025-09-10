// cookies.ts
export const ACCESS_COOKIE = 'access';
export const REFRESH_COOKIE = 'refresh';

const isProd = process.env.NODE_ENV === 'production';
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

const baseOpts = {
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/' as const,
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const accessCookieOpts = {
  ...baseOpts,
};

export const refreshCookieOpts = {
  ...baseOpts,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const clearCookieOpts = baseOpts;
