import { Router } from 'express';
import { getNotifications, markAsRead, markAsReadById, deleteNotification, deleteAllNotifications } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getNotifications);
router.post('/mark-read', authenticate, markAsRead);
router.patch('/read/:id', authenticate, markAsReadById);
router.delete('/:id', authenticate, deleteNotification);
router.delete('/', authenticate, deleteAllNotifications);

export default router;
