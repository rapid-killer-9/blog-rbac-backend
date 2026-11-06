import express from 'express';
import rateLimit from 'express-rate-limit';
import { Signup, Login,Profile } from '../controllers/authController';
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

// Profile route (requires authentication)
router.get(
  '/profile',
  authenticate, // Check if the user is logged in
  Profile
);

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
