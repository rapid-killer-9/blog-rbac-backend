import { Request, Response } from 'express';
import { signup, login, getUserProfile } from '../services/authService';
import { validateSignup, validateLogin } from '../utils/validationUtil';
import { UserRole } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

// Signup
export const Signup = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { username, email, password } = await validateSignup(req.body);

    // Create user
    const user = await signup({ 
      username, 
      email, 
      password 
    });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error: any) {
    res.status(400).json({ 
      message: error.message 
    });
  }
};

// Login
export const Login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { email, password } = await validateLogin(req.body);

    // Authenticate user
    const { token, user } = await login(email, password);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error: any) {
    res.status(401).json({ 
      message: error.message 
    });
  }
};

// Profile
export const Profile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return; // Ensure we exit the function early after responding
    }

    const profile = await getUserProfile(userId);

    res.json(profile); // Send the profile response
  } catch (error: any) {
    res.status(500).json({
      message: error.message
    });
  }
};
