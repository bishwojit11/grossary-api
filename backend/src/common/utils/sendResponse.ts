import { Response } from 'express';
import { TData } from '../../types/req-response';

const sendResponse = <T>(res: Response, data: TData<T>) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    meta: data.meta,
    token: data.token,
  });
};

export default sendResponse;
