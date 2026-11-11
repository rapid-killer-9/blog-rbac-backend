import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwtConfig';
import { generateRawToken, hashToken } from '../utils/tokenUtil';
import { unauthorized, notFound } from '../utils/errorUtil';
import prisma from '../lib/prisma';

const REFRESH_TOKEN_TTL_DAYS = 7;

function refreshTokenExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return d;
}

async function issueRefreshToken(userId: string): Promise<string> {
  const raw = generateRawToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt: refreshTokenExpiresAt(),
    },
  });
  return raw;
}

// Signup function
export const signup = async ({ username, email, password }: { username: string; email: string; password: string }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: UserRole.USER,
    },
  });

  return { id: user.id, username: user.username, email: user.email, role: user.role };
};

// Login function — returns both an access token and a refresh token
export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw unauthorized('Invalid email or password');
  }

  const accessToken = generateToken({ userId: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  };
};

// Rotate refresh token — revoke the incoming token and issue a new pair
export const rotateRefreshToken = async (rawToken: string) => {
  const hash = hashToken(rawToken);

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    // If the token is already revoked it may indicate token theft — revoke the whole family
    if (stored?.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw unauthorized('Invalid or expired refresh token');
  }

  // Revoke the used token before issuing a new one (rotation)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });

  const accessToken = generateToken({ userId: user.id, role: user.role });
  const newRefreshToken = await issueRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
};

// Logout — revoke the supplied refresh token
export const logoutUser = async (rawToken: string) => {
  const hash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

// Get user profile function
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw notFound('User not found');
  }

  return { id: user.id, username: user.username, email: user.email, profile: user.profile };
};
