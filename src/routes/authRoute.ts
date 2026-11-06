import express from 'express';
import rateLimit from 'express-rate-limit';
import { Signup, Login, Profile, Refresh, Logout } from '../controllers/authController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Stricter limit on credential endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// Signup route
router.post('/signup', authLimiter, Signup);

// Login route
router.post('/login', authLimiter, Login);

// Token refresh — no authentication required (the refresh token is the credential)
router.post('/refresh', Refresh);

// Logout — revoke the refresh token
router.post('/logout', Logout);

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
