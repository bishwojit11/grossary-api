import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export const createRateLimit = (options: RateLimitOptions) => {
  const buckets = new Map<string, Bucket>();
  const message = options.message ?? 'Too many requests. Please try again later.';

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = options.keyGenerator?.(req) ?? req.ip ?? 'unknown';
    const current = buckets.get(key);

    if (!current || now > current.resetAt) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (current.count >= options.max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message,
      });
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
};
