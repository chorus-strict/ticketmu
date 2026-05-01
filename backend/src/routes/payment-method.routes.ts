import { Router } from 'express';
import { 
  getPaymentMethods, 
  getAllPaymentMethods, 
  createPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod 
} from '../controllers/payment-method.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getPaymentMethods);
router.get('/admin', authenticate, getAllPaymentMethods);
router.post('/', authenticate, createPaymentMethod);
router.put('/:id', authenticate, updatePaymentMethod);
router.delete('/:id', authenticate, deletePaymentMethod);

export default router;
