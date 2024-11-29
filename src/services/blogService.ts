import { PrismaClient, BlogStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

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

// Get blogs by user role function
export const getBlogsByRole = async (userId: string, userRole: UserRole) => {
  if (userRole === UserRole.ADMIN) {
    // Admin can see all blogs
    return prisma.blog.findMany({
      include: {
        author: { select: { username: true, email: true } },
        tags: true,
      },
    });
  } else if (userRole === UserRole.MODERATOR) {
    // Moderator can see blogs in PENDING or DRAFT status
    return prisma.blog.findMany({
      where: {
        status: { in: [BlogStatus.DRAFT, BlogStatus.PENDING] },
      },
      include: {
        author: { select: { username: true, email: true } },
        tags: true,
      },
    });
  } else {
    // Regular user can only see their own blogs
    return prisma.blog.findMany({
      where: { authorId: userId },
      include: { tags: true },
    });
  }
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
