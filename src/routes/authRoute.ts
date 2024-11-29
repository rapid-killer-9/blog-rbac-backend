import express from 'express';
import { Signup, Login,Profile } from '../controllers/authController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Signup route
router.post('/signup', Signup);

// Login route
router.post('/login', Login);

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
