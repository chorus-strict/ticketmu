import { Router } from 'express';
import { getDailyAnalytics, getMonthlyAnalytics, getMonthAnalytics } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['ADMIN', 'ORGANIZER']));

router.get('/daily', getDailyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/month', getMonthAnalytics);

export default router;
