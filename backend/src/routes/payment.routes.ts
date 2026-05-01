import { Router } from 'express';
import { getPaymentHistory, confirmPayment } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/history', getPaymentHistory);
router.post('/confirm', confirmPayment);

// Admin endpoints
import { approveOrder, rejectOrder } from '../controllers/order.controller';
router.post('/:id/approve', approveOrder);
router.post('/:id/reject', rejectOrder);

export default router;
