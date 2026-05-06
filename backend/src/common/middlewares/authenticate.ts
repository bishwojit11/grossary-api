import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { prisma } from '../../lib/prisma';
import { UnauthorizedException } from '../errors/apiError';
import catchAsync from '../utils/catchAsync';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export const authenticate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    if (!config.jwtAccessSecret) {
      throw new UnauthorizedException('Server auth is not configured.');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.email !== decoded.email) {
      throw new UnauthorizedException('Invalid user.');
    }

    req.session = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    next();
  },
);

export default authenticate;
