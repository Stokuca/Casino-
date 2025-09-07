export const ACCESS_COOKIE = 'access';
export const REFRESH_COOKIE = 'refresh';

export const accessCookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,          // ⇐ u produkciji stavi true (HTTPS)
  path: '/',
  // maxAge: 15 * 60 * 1000, // opcionalno; možeš osloniti se i samo na JWT exp
};

export const refreshCookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,          // ⇐ u produkciji true
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
};
