import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../errors/apiError';

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isApi = err instanceof ApiError;
  const statusCode = isApi ? err.httpStatusCode ?? StatusCodes.INTERNAL_SERVER_ERROR : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err?.message || 'Something went wrong.';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(isApi && err.details ? { details: err.details } : {}),
    ...(!isApi && process.env.NODE_ENV !== 'production' ? { stack: err?.stack } : {}),
  });
};

export default globalErrorHandler;
