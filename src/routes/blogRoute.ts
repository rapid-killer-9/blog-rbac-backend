import express from 'express';
import { CreateBlog, GetBlogs, UpdateBlogStatus } from '../controllers/blogController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Create a new blog
router.post(
  '/create',
  authenticate, // Requires user to be authenticated
  CreateBlog
);

// Get blogs (accessible to all roles but with role-based filtering)
router.get(
  '/',
  authenticate, // Requires user to be authenticated
  GetBlogs
);

// Update blog status (Admin or Moderator)
router.patch(
  '/:id/status',
  authenticate, // Requires user to be authenticated
  authorize([UserRole.ADMIN, UserRole.MODERATOR]), // Only Admins or Moderators can update status
  UpdateBlogStatus
);

export default router;
