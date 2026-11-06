import { BlogStatus, UserRole } from '@prisma/client';
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

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// Get blogs by user role function
export const getBlogsByRole = async (
  userId: string,
  userRole: UserRole,
  { page, limit }: PaginationParams
): Promise<PaginatedResult<any>> => {
  const skip = (page - 1) * limit;

  const baseInclude = { tags: true };
  const adminModInclude = { author: { select: { username: true, email: true } }, tags: true };

  let where = {};
  if (userRole === UserRole.MODERATOR) {
    where = { status: { in: [BlogStatus.DRAFT, BlogStatus.PENDING] } };
  } else if (userRole === UserRole.USER) {
    where = { authorId: userId };
  }

  const include = userRole === UserRole.USER ? baseInclude : adminModInclude;

  const [data, total] = await Promise.all([
    prisma.blog.findMany({ where, include, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.blog.count({ where }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Update blog status function
export const updateBlogStatus = async (
  blogId: string,
  status: BlogStatus,
  userRole: UserRole
) => {
  // Only Admin or Moderator can update the blog status
  if (![UserRole.ADMIN, UserRole.MODERATOR].find((role) => role === userRole)) {
    throw new Error('Insufficient permissions to update blog status');
  }

  const blog = await prisma.blog.update({
    where: { id: blogId },
    data: { status },
  });

  return blog;
};
