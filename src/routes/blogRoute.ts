import express from 'express';
import { CreateBlog, GetBlogs, UpdateBlogStatus, DeleteBlog, RestoreBlog } from '../controllers/blogController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '@prisma/client';
import { writeLimiter } from '../config/rateLimiter';

const router = express.Router();

// Create a new blog
router.post('/create', writeLimiter, authenticate, CreateBlog);

// Get blogs (accessible to all roles but with role-based filtering)
router.get('/', authenticate, GetBlogs);

// Update blog status (Admin or Moderator)
router.patch('/:id/status', writeLimiter, authenticate, authorize([UserRole.ADMIN, UserRole.MODERATOR]), UpdateBlogStatus);

// Soft-delete a blog (author or Admin)
router.delete('/:id', writeLimiter, authenticate, DeleteBlog);

// Restore a soft-deleted blog (Admin only)
router.post('/:id/restore', writeLimiter, authenticate, authorize([UserRole.ADMIN]), RestoreBlog);

export default router;
