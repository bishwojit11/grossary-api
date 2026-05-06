import express from 'express';
import validateRequest from '../../../common/middlewares/validateRequest';
import { createRateLimit } from '../../../common/middlewares/rateLimit';
import authenticate from '../../../common/middlewares/authenticate';
import { AuthValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';

const router = express.Router();
const loginRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
  keyGenerator: (req) => `${req.ip}:${(req.body?.email as string | undefined) ?? ''}`,
});
const forgetPasswordRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
  keyGenerator: (req) => `${req.ip}:${(req.body?.email as string | undefined) ?? ''}`,
});

router
  .post(
    '/login',
    loginRateLimit,
    validateRequest(AuthValidation.loginValidationSchema),
    AuthControllers.login,
  )
  .post(
    '/registration',
    validateRequest(AuthValidation.registrationValidation),
    AuthControllers.registration,
  )
  .post(
    '/refresh-token',
    validateRequest(AuthValidation.refreshTokenValidationSchema),
    AuthControllers.refreshToken,
  )
  .post(
    '/logout',
    validateRequest(AuthValidation.logoutValidationSchema),
    AuthControllers.logout,
  )
  .post(
    '/forget-password',
    forgetPasswordRateLimit,
    validateRequest(AuthValidation.forgetPasswordValidationSchema),
    AuthControllers.forgetPassword,
  )
  .post(
    '/recover-password',
    validateRequest(AuthValidation.recoverPasswordValidationSchema),
    AuthControllers.recoverPassword,
  )
  .post(
    '/reset-password',
    authenticate,
    validateRequest(AuthValidation.resetPasswordValidationSchema),
    AuthControllers.resetPassword,
  );

export const AuthRouters = router;
