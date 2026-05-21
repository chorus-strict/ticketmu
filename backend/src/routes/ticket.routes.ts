import { Router } from 'express';
import { purchaseTicket, getTickets, validateTicket, updateTicket, deleteTicket } from '../controllers/ticket.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/purchase', authenticate, purchaseTicket);
router.get('/', authenticate, getTickets);
router.get('/my-tickets', authenticate, getTickets); // Keep for compatibility
router.patch('/:id', authenticate, authorize(['ADMIN']), updateTicket);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteTicket);
router.post('/validate', authenticate, authorize(['ADMIN', 'ORGANIZER']), validateTicket);

export default router;
