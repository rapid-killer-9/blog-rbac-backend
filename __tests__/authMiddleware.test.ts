import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../src/middlewares/authMiddleware';
import { generateToken } from '../src/config/jwtConfig';
import { UserRole } from '@prisma/client';

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(authHeader?: string): Request {
  return { headers: { authorization: authHeader } } as unknown as Request;
}

describe('authenticate', () => {
  it('attaches req.user and calls next() for a valid token', async () => {
    const token = generateToken({ userId: 'abc', role: UserRole.USER });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toMatchObject({ id: 'abc', role: UserRole.USER });
  });

  it('returns 401 when no Authorization header is present', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    const req = mockReq('Bearer invalidtoken');
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authorize', () => {
  it('calls next() when the user role is allowed', () => {
    const req = { user: { id: '1', role: UserRole.ADMIN } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authorize([UserRole.ADMIN])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when the user role is not in the allowed list', () => {
    const req = { user: { id: '1', role: UserRole.USER } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authorize([UserRole.ADMIN, UserRole.MODERATOR])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is absent', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authorize([UserRole.ADMIN])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
