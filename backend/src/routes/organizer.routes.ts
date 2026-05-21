import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as organizerController from '../controllers/organizer.controller';

const router = Router();

// Publicly available within authenticated users
router.post('/upgrade', authenticate, organizerController.upgrade);
router.post('/confirm-payment', authenticate, organizerController.confirmPayment);
router.get('/my-request', authenticate, organizerController.getMyRequest);

// Admin only routes
router.get('/requests', authenticate, authorize(['ADMIN']), organizerController.getRequests);
router.post('/approve/:id', authenticate, authorize(['ADMIN']), organizerController.approveRequest);
router.post('/reject/:id', authenticate, authorize(['ADMIN']), organizerController.rejectRequest);

// Protected Organizer routes
router.get('/profile', authenticate, authorize(['ORGANIZER', 'ADMIN']), organizerController.getProfile);
router.get('/stats', authenticate, authorize(['ORGANIZER', 'ADMIN']), organizerController.getStats);
router.get('/my-events', authenticate, authorize(['ORGANIZER', 'ADMIN']), organizerController.getMyEvents);
router.post('/validate-ticket', authenticate, authorize(['ORGANIZER', 'ADMIN']), organizerController.validateTicket);

export default router;
