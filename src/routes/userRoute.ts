import express from 'express';
import { UpdateProfile, GetAllUsers, GetUserById } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Update user profile (requires authentication)
router.patch(
  '/profile',
  authenticate, // Requires user to be logged in
  UpdateProfile
);

// Get all users (Admin-only)
router.get(
  '/',
  authenticate, // Requires user to be logged in
  authorize([UserRole.ADMIN]), // Only Admins can view all users
  GetAllUsers
);

// Get a user by ID (Admin-only)
router.get(
  '/:id',
  authenticate, // Requires user to be logged in
  authorize([UserRole.ADMIN]), // Only Admins can view user details by ID
  GetUserById
);

export default router;
