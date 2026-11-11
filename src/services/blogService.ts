import { BlogStatus, UserRole } from '@prisma/client';
import { forbidden, notFound, badRequest } from '../utils/errorUtil';
import prisma from '../lib/prisma';

// Create blog function
export const createBlog = async ({
  title,
  content,
  authorId,
  tags,
}: {
  title: string;
  content: string;
  authorId: string;
  tags?: string[];
}) => {
  // Create tags if they don't exist
  const tagRecords = tags
    ? await Promise.all(
        tags.map((tag) =>
          prisma.blogTag.upsert({
            where: { name: tag },
            create: { name: tag },
            update: {},
          })
        )
      )
    : [];

  const blog = await prisma.blog.create({
    data: {
      title,
      content,
      authorId,
      tags: {
        connect: tagRecords.map((tag) => ({ id: tag.id })),
      },
    },
    include: { tags: true }, // Include tags in the response
  });

  return blog;
};

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface FilterParams {
  status?: BlogStatus;
  tag?: string;
  q?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// Get blogs by user role function
export const getBlogsByRole = async (
  userId: string,
  userRole: UserRole,
  { page, limit }: PaginationParams,
  filters: FilterParams = {}
): Promise<PaginatedResult<any>> => {
  const skip = (page - 1) * limit;

  const baseInclude = { tags: true };
  const adminModInclude = { author: { select: { username: true, email: true } }, tags: true };

  // Base role-scoped where clause
  let where: Record<string, any> = { deletedAt: null };
  if (userRole === UserRole.MODERATOR) {
    where.status = { in: [BlogStatus.DRAFT, BlogStatus.PENDING] };
  } else if (userRole === UserRole.USER) {
    where.authorId = userId;
  }

  // Apply optional filters on top of the role filter
  if (filters.status) {
    // For MODERATOR: intersect requested status with their allowed statuses
    if (userRole === UserRole.MODERATOR) {
      const allowed: BlogStatus[] = [BlogStatus.DRAFT, BlogStatus.PENDING];
      where.status = allowed.includes(filters.status) ? filters.status : { in: [] };
    } else {
      where.status = filters.status;
    }
  }

  if (filters.tag) {
    where.tags = { some: { name: { equals: filters.tag, mode: 'insensitive' } } };
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { content: { contains: filters.q, mode: 'insensitive' } },
    ];
  }

  const include = userRole === UserRole.USER ? baseInclude : adminModInclude;

  const [data, total] = await Promise.all([
    prisma.blog.findMany({ where, include, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.blog.count({ where }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Soft-delete a blog — only the author or an ADMIN may delete
export const deleteBlog = async (blogId: string, requesterId: string, requesterRole: UserRole) => {
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });

  if (!blog || blog.deletedAt) {
    throw notFound('Blog not found');
  }

  if (requesterRole !== UserRole.ADMIN && blog.authorId !== requesterId) {
    throw forbidden('Forbidden: you can only delete your own posts');
  }

  return prisma.blog.update({
    where: { id: blogId },
    data: { deletedAt: new Date() },
  });
};

// Restore a soft-deleted blog — ADMIN only
export const restoreBlog = async (blogId: string, requesterRole: UserRole) => {
  if (requesterRole !== UserRole.ADMIN) {
    throw forbidden('Forbidden: only admins can restore posts');
  }

  const blog = await prisma.blog.findUnique({ where: { id: blogId } });

  if (!blog) {
    throw notFound('Blog not found');
  }

  if (!blog.deletedAt) {
    throw badRequest('Blog is not deleted');
  }

  return prisma.blog.update({
    where: { id: blogId },
    data: { deletedAt: null },
  });
};

// Update blog status function
export const updateBlogStatus = async (
  blogId: string,
  status: BlogStatus,
  userRole: UserRole
) => {
  // Only Admin or Moderator can update the blog status
  if (![UserRole.ADMIN, UserRole.MODERATOR].find((role) => role === userRole)) {
    throw forbidden('Insufficient permissions to update blog status');
  }

  const blog = await prisma.blog.update({
    where: { id: blogId },
    data: { status },
  });

  return blog;
};
