import { Request, Response } from 'express';
import { createBlog, getBlogsByRole, updateBlogStatus, deleteBlog, restoreBlog } from '../services/blogService';
import { validateBlogCreation } from '../utils/validationUtil';
import { BlogStatus } from '@prisma/client';

// Create Blog
export const CreateBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const authorId = req.user?.id;

    if (!authorId) {
      return;
    }

    // Validate input
    const { title, content, tags } = await validateBlogCreation(req.body);

    const blog = await createBlog({
      title,
      content,
      authorId,
      tags
    });

    res.status(201).json({
      message: 'Blog created successfully',
      blog
    });
  } catch (error: any) {
    res.status(400).json({ 
      message: error.message 
    });
  }
};

// Get Blogs
export const GetBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await getBlogsByRole(userId, userRole, { page, limit });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Update Blog Status
export const UpdateBlogStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user?.role;

    if (!userRole) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!Object.values(BlogStatus).includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    const updatedBlog = await updateBlogStatus(id, status, userRole);

    res.json({ message: 'Blog status updated', blog: updatedBlog });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Blog (soft)
export const DeleteBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await deleteBlog(id, userId, userRole);
    res.json({ message: 'Blog deleted' });
  } catch (error: any) {
    const status = error.message.startsWith('Forbidden') ? 403 : 404;
    res.status(status).json({ message: error.message });
  }
};

// Restore Blog (ADMIN only)
export const RestoreBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (!userRole) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const blog = await restoreBlog(id, userRole);
    res.json({ message: 'Blog restored', blog });
  } catch (error: any) {
    const status = error.message.startsWith('Forbidden') ? 403 : 404;
    res.status(status).json({ message: error.message });
  }
};
