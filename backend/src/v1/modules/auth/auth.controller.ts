import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../common/utils/catchAsync';
import sendResponse from '../../../common/utils/sendResponse';
import { AuthServices } from './auth.service';
import {
  refreshTokenClearCookieOptions,
  refreshTokenCookieOptions,
} from './auth.const';

const registration = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.registrationIntoDB(req.body);
  res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Registration successful.',
    data: { user: result.user },
    token: result.accessToken,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginIntoDB(req.body);
  res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Login successful.',
    data: { user: result.user },
    token: result.accessToken,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.refreshAccessToken({
    refreshToken: req.cookies.refreshToken,
  });
  res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Access token refreshed.',
    data: { user: result.user },
    token: result.accessToken,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.logout({
    refreshToken: req.cookies.refreshToken,
  });
  res.clearCookie('refreshToken', refreshTokenClearCookieOptions);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Logged out successfully.',
    data: null,
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.forgetPassword(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'If the account exists, recovery instructions were sent.',
    data: null,
  });
});

const recoverPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.recoverPassword(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Password recovered successfully.',
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.session?.user?.id) {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Unauthorized.',
      data: null,
    });
    return;
  }
  await AuthServices.resetPassword({
    userId: req.session.user.id,
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword,
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Password reset successfully.',
    data: null,
  });
});

export const AuthControllers = {
  registration,
  login,
  refreshToken,
  logout,
  forgetPassword,
  recoverPassword,
  resetPassword,
};
