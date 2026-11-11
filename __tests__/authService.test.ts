import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { signup, login, rotateRefreshToken, logoutUser } from '../src/services/authService';

// Mock the Prisma singleton before any import resolves it
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import prisma from '../src/lib/prisma';

const mockUser = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  password: '',  // filled in beforeEach
  role: UserRole.USER,
  createdAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// ─── signup ────────────────────────────────────────────────────────────────

describe('signup', () => {
  it('creates a user with role USER and returns safe fields', async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({ ...mockUser });

    const result = await signup({ username: 'alice', email: 'alice@example.com', password: 'password123' });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: UserRole.USER }),
      })
    );
    expect(result).not.toHaveProperty('password');
    expect(result.role).toBe(UserRole.USER);
  });

  it('hashes the password before storing', async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({ ...mockUser });

    await signup({ username: 'alice', email: 'alice@example.com', password: 'plaintext' });

    const storedPassword = (prisma.user.create as jest.Mock).mock.calls[0][0].data.password;
    expect(storedPassword).not.toBe('plaintext');
    expect(await bcrypt.compare('plaintext', storedPassword)).toBe(true);
  });

  it('propagates a duplicate-key error from Prisma (username/email conflict)', async () => {
    const prismaError = new Error('Unique constraint failed on the fields: (`email`)');
    prismaError.name = 'PrismaClientKnownRequestError';
    (prisma.user.create as jest.Mock).mockRejectedValue(prismaError);

    await expect(
      signup({ username: 'alice', email: 'alice@example.com', password: 'password123' })
    ).rejects.toThrow('Unique constraint failed');
  });
});

// ─── login ─────────────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(async () => {
    mockUser.password = await bcrypt.hash('correct-password', 10);
  });

  it('returns accessToken, refreshToken, and safe user fields on success', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser });
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

    const result = await login('alice@example.com', 'correct-password');

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws when the user does not exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(login('nobody@example.com', 'password')).rejects.toThrow('Invalid email or password');
  });

  it('throws on a wrong password', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser });

    await expect(login('alice@example.com', 'wrong-password')).rejects.toThrow('Invalid email or password');
  });

  it('returns the same error message for missing user and wrong password (no user enumeration)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const noUserError = await login('nobody@example.com', 'x').catch((e: Error) => e.message);

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser });
    const wrongPassError = await login('alice@example.com', 'wrong').catch((e: Error) => e.message);

    expect(noUserError).toBe(wrongPassError);
  });

  it('throws an error with statusCode 401 on invalid credentials', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const error: any = await login('x@x.com', 'wrong').catch((e) => e);
    expect(error.statusCode).toBe(401);
  });
});

// ─── rotateRefreshToken ────────────────────────────────────────────────────

describe('rotateRefreshToken', () => {
  const rawToken = 'a'.repeat(96);

  const validStoredToken = {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    revokedAt: null,
    createdAt: new Date(),
  };

  it('returns a new token pair and revokes the old token', async () => {
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(validStoredToken);
    (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
    (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({ ...mockUser });
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

    const result = await rotateRefreshToken(rawToken);

    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ revokedAt: expect.any(Date) }) })
    );
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('throws when the token does not exist', async () => {
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(rotateRefreshToken(rawToken)).rejects.toThrow('Invalid or expired refresh token');
  });

  it('throws when the token has expired', async () => {
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      ...validStoredToken,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(rotateRefreshToken(rawToken)).rejects.toThrow('Invalid or expired refresh token');
  });

  it('revokes ALL active sessions on replay (reuse detection)', async () => {
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      ...validStoredToken,
      revokedAt: new Date(),  // already revoked — replay attack
    });
    (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({});

    await expect(rotateRefreshToken(rawToken)).rejects.toThrow('Invalid or expired refresh token');

    // Must revoke all active tokens for the user
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: validStoredToken.userId, revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    );
  });
});

// ─── logoutUser ────────────────────────────────────────────────────────────

describe('logoutUser', () => {
  it('revokes the matching refresh token', async () => {
    (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    await logoutUser('somerawtoken');

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    );
  });

  it('does not throw when the token is already revoked or not found', async () => {
    (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(logoutUser('unknowntoken')).resolves.not.toThrow();
  });
});

// ─── errorUtil statusCode propagation ──────────────────────────────────────

describe('typed error statusCodes', () => {
  it('rotateRefreshToken throws with statusCode 401 for an expired token', async () => {
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      id: 'rt-1', userId: 'u-1', tokenHash: 'h', revokedAt: null,
      expiresAt: new Date(Date.now() - 1000), createdAt: new Date(),
    });

    const error: any = await rotateRefreshToken('a'.repeat(96)).catch((e) => e);
    expect(error.statusCode).toBe(401);
  });

  it('rotateRefreshToken throws with statusCode 401 on replay', async () => {
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      id: 'rt-1', userId: 'u-1', tokenHash: 'h',
      revokedAt: new Date(), expiresAt: new Date(Date.now() + 10000), createdAt: new Date(),
    });
    (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({});

    const error: any = await rotateRefreshToken('a'.repeat(96)).catch((e) => e);
    expect(error.statusCode).toBe(401);
  });
});
