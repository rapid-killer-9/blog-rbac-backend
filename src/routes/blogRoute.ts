import express from 'express';
import { CreateBlog, GetBlogs, UpdateBlogStatus, DeleteBlog, RestoreBlog } from '../controllers/blogController';
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
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MODERATOR]),
  UpdateBlogStatus
);

// Soft-delete a blog (author or Admin)
router.delete('/:id', authenticate, DeleteBlog);

// Restore a soft-deleted blog (Admin only)
router.post('/:id/restore', authenticate, authorize([UserRole.ADMIN]), RestoreBlog);

export default router;
