import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  checkoutFromCart
} from '../controllers/cart.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItemQuantity);
router.delete('/:id', removeFromCart);
router.post('/checkout', checkoutFromCart);

export default router;
