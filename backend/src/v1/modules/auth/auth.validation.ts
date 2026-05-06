import { z } from 'zod';

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

const registrationValidation = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(32),
  }),
});

const logoutValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(32),
  }),
});

const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const recoverPasswordValidationSchema = z.object({
  body: z.object({
    recoveryToken: z.string().min(32),
    newPassword: z.string().min(8).max(128),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(8).max(128),
    newPassword: z.string().min(8).max(128),
  }),
});

export const AuthValidation = {
  loginValidationSchema,
  registrationValidation,
  refreshTokenValidationSchema,
  logoutValidationSchema,
  forgetPasswordValidationSchema,
  recoverPasswordValidationSchema,
  resetPasswordValidationSchema,
};
