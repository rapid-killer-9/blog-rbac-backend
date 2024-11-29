import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update user profile function
export const updateUserProfile = async (
  userId: string,
  profileData: { bio?: string; location?: string }
) => {
  // Check if the user has a profile; if not, create it
  let profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId, ...profileData },
    });
  } else {
    // Update the existing profile
    profile = await prisma.profile.update({
      where: { userId },
      data: profileData,
    });
  }

  return profile;
};

// Get all users function
export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
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
