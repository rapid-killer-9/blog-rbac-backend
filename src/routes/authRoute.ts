import express from 'express';
import { Signup, Login, Profile, Refresh, Logout } from '../controllers/authController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '@prisma/client';
import { authLimiter, tokenLimiter } from '../config/rateLimiter';

const router = express.Router();

// Signup route
router.post('/signup', authLimiter, Signup);

// Login route
router.post('/login', authLimiter, Login);

// Token refresh — no authentication required (the refresh token is the credential)
router.post('/refresh', tokenLimiter, Refresh);

// Logout — revoke the refresh token
router.post('/logout', tokenLimiter, Logout);

// Profile route (requires authentication)
router.get('/profile', authenticate, Profile);

// Example of role-based route (Admin-only)
router.get(
  '/admin-dashboard',
  authenticate, // Check if the user is logged in
  authorize([UserRole.ADMIN]), // Allow only Admins
  (req, res) => {
    res.json({ message: 'Welcome to the admin dashboard' });
  }
);

export default router;
