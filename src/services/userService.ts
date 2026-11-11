import prisma from '../lib/prisma';

// Update user profile function
export const updateUserProfile = async (
  userId: string,
  profileData: { bio?: string; location?: string }
) => {
  return prisma.profile.upsert({
    where: { userId },
    create: { userId, ...profileData },
    update: profileData,
  });
};

export interface PaginationParams {
  page: number;
  limit: number;
}

// Get all users function
export const getAllUsers = async ({ page, limit }: PaginationParams) => {
  const skip = (page - 1) * limit;
  const select = { id: true, username: true, email: true, role: true, createdAt: true };

  const [data, total] = await Promise.all([
    prisma.user.findMany({ select, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count(),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Get user by ID function
export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      profile: {
        select: { bio: true, location: true },
      },
    },
  });
};
