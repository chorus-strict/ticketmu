import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await userService.getAll(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, phone, avatar, email } = req.body;
    
    // Only allow email change if user is ADMIN
    const updateData: any = { name, phone, avatar };
    if (email && req.user!.role === 'ADMIN') {
      updateData.email = email;
    }
    
    const user = await userService.update(userId, updateData);

    // Create personal profile update notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Profile Updated',
        message: 'Your personal profile details have been successfully updated.',
        link: '/settings',
        roleTarget: 'USER',
        type: 'SYSTEM'
      }
    }).catch(err => console.error('Failed to create profile update notification:', err));

    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.getById(req.user!.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
