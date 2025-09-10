export const ACCESS_COOKIE = 'access';
export const REFRESH_COOKIE = 'refresh';

export const accessCookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false, 
  path: '/',

};

export const refreshCookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,         
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
