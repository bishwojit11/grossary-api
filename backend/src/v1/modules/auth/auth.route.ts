import express from 'express';
import validateRequest from '../../../common/middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';

const router = express.Router();

router
  .post(
    '/login',
    validateRequest(AuthValidation.loginValidationSchema),
    AuthControllers.login,
  )
  .post(
    '/registration',
    validateRequest(AuthValidation.registrationValidation),
    AuthControllers.registration,
  )
  // Backward-compatible endpoint
  .post(
    '/register',
    validateRequest(AuthValidation.registrationValidation),
    AuthControllers.register,
  );

export const AuthRouters = router;
