import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

interface TokenPayload {
  userId: User['id'];
  role: User['role'];
}

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Generate a JWT token
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN });
};

// Verify the JWT token
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, SECRET_KEY) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Decode the JWT token
export const decodeToken = (token: string): TokenPayload | null => {
  return jwt.decode(token) as TokenPayload | null;
};

// Generate a refresh token
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' }); // Longer expiration for refresh token
};
