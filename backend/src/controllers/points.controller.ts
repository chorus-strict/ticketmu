import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PointsService } from '../services/points.service';
import { prisma } from '../lib/prisma';

export const getUserPoints = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const balance = await PointsService.getUserPoints(userId);
    res.json({ balance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPointLogs = async (req: AuthRequest, res: Response) => {
  try {
    let userId = req.user!.id;
    
    // Admin can request logs for other users
    if (req.user?.role === 'ADMIN' && req.query.userId) {
      userId = req.query.userId as string;
    }

    const logs = await PointsService.getPointLogs(userId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRewards = async (req: AuthRequest, res: Response) => {
  try {
    const includeInactive = req.user?.role === 'ADMIN';
    const rewards = await PointsService.getRewards(includeInactive);
    res.json(rewards);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const redeemReward = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rewardId } = req.body;
    const result = await PointsService.redeemPoints(userId, rewardId);
    res.json({ message: 'Reward redeemed successfully', reward: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserRewards = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRewards = await PointsService.getUserAvailableRewards(userId);
    res.json(userRewards);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin only: adjust points
export const adjustPoints = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, points, description } = req.body;
    await PointsService.adjustPoints(req.user!.id, userId, points, description);
    res.json({ message: 'Points adjusted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Admin only: get current config
export const getPointsConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = await PointsService.getSystemConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin only: update config
export const updatePointsConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = await PointsService.updateSystemConfig(req.body);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Admin only: create reward
export const createReward = async (req: AuthRequest, res: Response) => {
  try {
    const reward = await PointsService.createReward(req.body);
    res.status(201).json(reward);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Admin only: update reward
export const updateReward = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reward = await PointsService.updateReward(id, req.body);
    res.json(reward);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Admin only: delete reward (soft delete)
export const deleteReward = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await PointsService.deleteReward(id);
    res.json({ message: 'Reward deactivated successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
