import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../../../config';
import { prisma } from '../../../lib/prisma';
import { BadRequestException, UnauthorizedException } from '../../../common/errors/apiError';

const refreshTokenRepo = (prisma as unknown as { refreshToken: any }).refreshToken;
const passwordResetTokenRepo = (
  prisma as unknown as { passwordResetToken: any }
).passwordResetToken;

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

    const { accessToken, refreshToken } = await issueTokenPair(user);

    return { user, accessToken, refreshToken };
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

    const { accessToken, refreshToken } = await issueTokenPair(safe);

    return { user: safe, accessToken, refreshToken };
  },

  async refreshAccessToken(payload: { refreshToken: string }) {
    const decoded = verifyRefreshToken(payload.refreshToken);
    const tokenHash = hashToken(payload.refreshToken);
    const now = new Date();

    const storedToken = await refreshTokenRepo.findFirst({
      where: {
        userId: decoded.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user.');
    }

    await refreshTokenRepo.update({
      where: { id: storedToken.id },
      data: { revokedAt: now },
    });

    const { accessToken, refreshToken } = await issueTokenPair(user);

    return { user, accessToken, refreshToken };
  },

  async logout(payload: { refreshToken: string }) {
    const tokenHash = hashToken(payload.refreshToken);
    await refreshTokenRepo.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return { success: true };
  },

  async forgetPassword(payload: { email: string }) {
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, email: true },
    });

    // Return success regardless of user existence to reduce account enumeration.
    if (!user) {
      return {
        success: true,
      };
    }

    const resetToken = createOpaqueToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(
      Date.now() + config.passwordResetExpiresMinutes * 60 * 1000,
    );

    await passwordResetTokenRepo.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    await passwordResetTokenRepo.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Replace this with email dispatch in production.
    return {
      success: true,
    };
  },

  async recoverPassword(payload: { recoveryToken: string; newPassword: string }) {
    const tokenHash = hashToken(payload.recoveryToken);
    const now = new Date();

    const resetRow = await passwordResetTokenRepo.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      include: {
        user: true,
      },
    });

    if (!resetRow) {
      throw new BadRequestException('Invalid or expired recovery token.');
    }

    const nextPasswordHash = await bcrypt.hash(
      payload.newPassword,
      config.bcryptSaltRounds,
    );

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRow.userId },
        data: { passwordHash: nextPasswordHash },
      }),
      passwordResetTokenRepo.update({
        where: { id: resetRow.id },
        data: { usedAt: now },
      }),
      refreshTokenRepo.updateMany({
        where: { userId: resetRow.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return { success: true };
  },

  async resetPassword(payload: {
    userId: string;
    oldPassword: string;
    newPassword: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user.');
    }

    const ok = await bcrypt.compare(payload.oldPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException('Invalid old password.');
    }

    const nextPasswordHash = await bcrypt.hash(
      payload.newPassword,
      config.bcryptSaltRounds,
    );

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: nextPasswordHash },
      }),
      refreshTokenRepo.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return { success: true };
  },
};

function parseDurationToSeconds(value: string): number {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const match = /^(\d+)([smhd])$/i.exec(trimmed);
  if (!match) {
    throw new BadRequestException('Invalid JWT_REFRESH_EXPIRES_IN format.');
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const factor = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return amount * factor;
}

function createOpaqueToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueTokenPair(user: { id: string; email: string; role: Role }) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user.id);

  const expiresInSeconds = parseDurationToSeconds(config.jwtRefreshExpiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  await refreshTokenRepo.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

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

function signRefreshToken(userId: string): string {
  const secret = config.jwtRefreshSecret as Secret;
  const options: SignOptions = {
    expiresIn: config.jwtRefreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(
    {
      sub: userId,
      type: 'refresh',
    },
    secret,
    options,
  );
}

function verifyRefreshToken(token: string): { sub: string } {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as {
      sub?: string;
      type?: string;
    };
    if (!decoded.sub || decoded.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token payload.');
    }
    return { sub: decoded.sub };
  } catch {
    throw new UnauthorizedException('Invalid or expired refresh token.');
  }
}
