import { Response } from 'express';
import { orderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, ticketTierId, paymentMethodId, userRewardId } = req.body;
    const order = await orderService.create(req.user!.id, eventId, ticketTierId, paymentMethodId, userRewardId);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Order creation failed' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'ADMIN') {
      const limit = Number(req.query.limit) || 1000;
      const offset = Number(req.query.offset) || 0;
      const result = await orderService.getAll(limit, offset);
      return res.json(result);
    }
    
    if (req.user!.role === 'ORGANIZER') {
      const orders = await orderService.getByOrganizer(req.user!.id);
      return res.json({ orders, total: orders.length });
    }
    
    const orders = await orderService.getByUser(req.user!.id);
    res.json({ orders, total: orders.length });
  } catch (error: any) {
    console.error('ERROR [OrderController.getOrders]:', {
      name: error.name,
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({ 
      message: error.message || 'Internal Server Error',
      shortMessage: error.name === 'PrismaClientKnownRequestError' ? `Prisma Error ${error.code}` : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

export const approveOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await orderService.approve(req.params.id, req.user!.id, req.user!.role);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await orderService.reject(req.params.id, req.user!.id, req.user!.role);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
