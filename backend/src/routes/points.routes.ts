import { Router } from 'express';
import { 
  getUserPoints, 
  getPointLogs, 
  getRewards, 
  getUserRewards,
  redeemReward,
  createReward,
  updateReward,
  deleteReward,
  adjustPoints,
  getPointsConfig,
  updatePointsConfig
} from '../controllers/points.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/balance', authenticate, getUserPoints);
router.get('/logs', authenticate, getPointLogs);
router.get('/rewards', authenticate, getRewards);
router.get('/my-rewards', authenticate, getUserRewards);
router.post('/redeem', authenticate, redeemReward);

// Admin only
router.post('/rewards', authenticate, authorize(['ADMIN']), createReward);
router.patch('/rewards/:id', authenticate, authorize(['ADMIN']), updateReward);
router.delete('/rewards/:id', authenticate, authorize(['ADMIN']), deleteReward);
router.post('/adjust', authenticate, authorize(['ADMIN']), adjustPoints);
router.get('/config', authenticate, authorize(['ADMIN']), getPointsConfig);
router.patch('/config', authenticate, authorize(['ADMIN']), updatePointsConfig);

export default router;
