import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberFromEnv(process.env.PORT, 4000),
  databaseUrl: requiredEnv('DATABASE_URL'),
  jwtAccessSecret: requiredEnv('JWT_ACCESS_SECRET'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '8h',
  jwtRefreshSecret: requiredEnv('JWT_REFRESH_SECRET'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  passwordResetExpiresMinutes: numberFromEnv(
    process.env.PASSWORD_RESET_EXPIRES_MINUTES,
    15,
  ),
  bcryptSaltRounds: numberFromEnv(process.env.BCRYPT_SALT_ROUNDS, 12),
} as const;
