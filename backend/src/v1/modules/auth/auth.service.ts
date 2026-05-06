import bcrypt from 'bcryptjs';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../../../config';
import { prisma } from '../../../lib/prisma';
import { BadRequestException, UnauthorizedException } from '../../../common/errors/apiError';

export const AuthServices = {
  async registrationIntoDB(payload: { email: string; password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (existing) {
      throw new BadRequestException('Email is already registered.');
    }

    const passwordHash = await bcrypt.hash(
      payload.password,
      config.bcryptSaltRounds,
    );

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role: Role.USER,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const token = signAccessToken(user);

    return { user, token };
  },

  async loginIntoDB(payload: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const ok = await bcrypt.compare(payload.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const safe = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    const token = signAccessToken(safe);

    return { user: safe, token };
  },

  // Backward-compatible aliases
  registerUser(payload: { email: string; password: string }) {
    return this.registrationIntoDB(payload);
  },
  loginUser(payload: { email: string; password: string }) {
    return this.loginIntoDB(payload);
  },
};

function signAccessToken(user: {
  id: string;
  email: string;
  role: Role;
}): string {
  if (!config.jwtAccessSecret) {
    throw new BadRequestException('JWT_ACCESS_SECRET is not configured.');
  }

  const secret = config.jwtAccessSecret as Secret;
  const expiresIn = config.jwtAccessExpiresIn as SignOptions['expiresIn'];
  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    options,
  );
}
