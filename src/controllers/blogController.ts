import { Request, Response } from 'express';
import { createBlog, getBlogsByRole, updateBlogStatus} from '../services/blogService';
import { validateBlogCreation } from '../utils/validationUtil';
import { BlogStatus, UserRole } from '@prisma/client';
import { promises } from 'dns';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

// Create Blog
export const CreateBlog = async (req: AuthRequest, res: Response): Promise<void> => {
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
export const GetBlogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return; 
    }

    const blogs = await getBlogsByRole(userId, userRole);

    res.json(blogs);
  } catch (error: any) {
    res.status(500).json({ 
      message: error.message 
    });
  }
};

// Update Blog Status
export const UpdateBlogStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user?.role;

    if (!userRole) {
      return;
    }

    // Validate status
    if (!Object.values(BlogStatus).includes(status)) {
      return;
    }

    const updatedBlog = await updateBlogStatus(
      id, 
      status, 
      userRole
    );

    res.json({
      message: 'Blog status updated',
      blog: updatedBlog
    });
  } catch (error: any) {
    res.status(400).json({ 
      message: error.message 
    });
  }
};
