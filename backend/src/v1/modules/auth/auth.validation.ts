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

export const AuthValidation = {
  loginValidationSchema,
  registrationValidation,
  // Backward-compatible alias
  registerValidationSchema: registrationValidation,
};
