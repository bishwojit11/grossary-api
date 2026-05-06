import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../common/utils/catchAsync';
import sendResponse from '../../../common/utils/sendResponse';
import { AuthServices } from './auth.service';

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.registrationIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Registration successful.',
    data: { user: result.user },
    token: result.token,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Login successful.',
    data: { user: result.user },
    token: result.token,
  });
});

export const AuthControllers = {
  register,
  registration: register,
  login,
};
