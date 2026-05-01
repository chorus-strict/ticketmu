import { Router } from 'express';
import { handleTripayWebhook } from '../controllers/webhook.controller';

const router = Router();

router.post('/tripay', handleTripayWebhook);

export default router;
