import { Router } from 'express';
import { createOrder, getOrders, approveOrder, rejectOrder } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.post('/:id/approve', authenticate, approveOrder);
router.post('/:id/reject', authenticate, rejectOrder);

export default router;
