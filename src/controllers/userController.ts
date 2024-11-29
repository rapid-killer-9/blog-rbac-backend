import { NextFunction, Request, Response } from 'express';
import { updateUserProfile, getAllUsers, getUserById} from '../services/userService';
import { validateProfileUpdate } from '../utils/validationUtil';
import { UserRole } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

// Update Profile
export const UpdateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return; // Early exit if userId is not found
    }

    // Validate input
    const profileData = await validateProfileUpdate(req.body);

    const updatedProfile = await updateUserProfile(userId, profileData);

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error: any) {
    res.status(400).json({ 
      message: error.message 
    });
  }
};

// Get All Users
export const GetAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ 
      message: error.message 
    });
  }
};

// Get User by ID
export const GetUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ 
      message: error.message 
    });
  }
};
