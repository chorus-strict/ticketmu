import { Router } from 'express';
import { 
  requestUpgrade, 
  getMembershipOrders, 
  approveMembership, 
  rejectMembership,
  getUserMembershipOrder,
  updateMembershipStatus,
  confirmMembershipPayment
} from '../controllers/membership.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/request', authenticate, requestUpgrade);
router.post('/confirm', authenticate, confirmMembershipPayment);
router.get('/my-request', authenticate, getUserMembershipOrder);
router.get('/orders', authenticate, authorize(['ADMIN']), getMembershipOrders);
router.post('/approve/:id', authenticate, authorize(['ADMIN']), approveMembership);
router.post('/reject/:id', authenticate, authorize(['ADMIN']), rejectMembership);
router.post('/status/:id', authenticate, authorize(['ADMIN']), updateMembershipStatus);

export default router;
