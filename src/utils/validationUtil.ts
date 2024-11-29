import { z } from 'zod';

// Signup validation schema
const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Blog creation validation schema
const blogCreationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  tags: z.array(z.string()).optional()
});

// Profile update validation schema
const profileUpdateSchema = z.object({
  bio: z.string().optional(),
  location: z.string().optional()
});

// Validation functions
export const validateSignup = async (data: unknown) => {
  return signupSchema.parse(data);
};

export const validateLogin = async (data: unknown) => {
  return loginSchema.parse(data);
};

export const validateBlogCreation = async (data: unknown) => {
  return blogCreationSchema.parse(data);
};

export const validateProfileUpdate = async (data: unknown) => {
  return profileUpdateSchema.parse(data);
};
