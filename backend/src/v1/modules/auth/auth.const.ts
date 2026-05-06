import { config } from '../../../config';

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

export const refreshTokenClearCookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
};
