import { Request, Response } from 'express';
import { signup, login, getUserProfile, rotateRefreshToken, logoutUser } from '../services/authService';
import { validateSignup, validateLogin } from '../utils/validationUtil';

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
    const { email, password } = await validateLogin(req.body);

    const { accessToken, refreshToken, user } = await login(email, password);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user,
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

// Refresh — exchange a valid refresh token for a new access + refresh token pair
export const Refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
      res.status(400).json({ message: 'refreshToken is required' });
      return;
    }

    const tokens = await rotateRefreshToken(refreshToken);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

// Logout — revoke the supplied refresh token
export const Logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
      res.status(400).json({ message: 'refreshToken is required' });
      return;
    }

    await logoutUser(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Profile
export const Profile = async (req: Request, res: Response): Promise<void> => {
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
