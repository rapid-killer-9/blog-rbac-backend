import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwtConfig';

const prisma = new PrismaClient();

// Signup function
export const signup = async ({ username, email, password }: { username: string; email: string; password: string }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: UserRole.USER, // Default role
    },
  });

  return { id: user.id, username: user.username, email: user.email, role: user.role };
};

// Login function
export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({ userId: user.id, role: user.role });

  return { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
};

// Get user profile function
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return { id: user.id, username: user.username, email: user.email, profile: user.profile };
};
