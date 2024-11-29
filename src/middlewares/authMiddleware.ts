import { Request, Response, NextFunction } from 'express';
import { verifyToken, } from '../config/jwtConfig';
import { UserRole } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

// Authentication Middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token

  if (!token) {
    res.status(401).json({ message: 'Authorization token is required' });
    return; // Explicitly return to avoid proceeding to `next()`
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role
    }; // Attach the user info to the request
    next(); // Proceed to the next middleware
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Authorization Middleware
export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
      return; // Prevent further processing
    }

    next(); // Proceed to the next middleware
  };
};
