import { Response } from 'express';
import { orderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, paymentMethodId, userRewardId } = req.body;
    const order = await orderService.create(req.user!.id, eventId, paymentMethodId, userRewardId);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Order creation failed' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'ADMIN') {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const result = await orderService.getAll(limit, offset);
      return res.json(result);
    }
    
    const orders = await orderService.getByUser(req.user!.id);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can approve orders' });
    }
    const order = await orderService.approve(req.params.id);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can reject orders' });
    }
    const order = await orderService.reject(req.params.id);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
