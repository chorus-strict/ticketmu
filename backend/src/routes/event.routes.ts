import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent, getTrendingEvents, getSpotlightEvents } from '../controllers/event.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getEvents);
router.get('/trending', getTrendingEvents);
router.get('/spotlight', getSpotlightEvents);
router.get('/search', getEvents); // Point search to getEvents as it handles q=
router.get('/:id', getEventById);

// Protected Admin & Organizer Routes
router.post('/', authenticate, authorize(['ADMIN', 'ORGANIZER']), createEvent);
router.put('/:id', authenticate, authorize(['ADMIN', 'ORGANIZER']), updateEvent);
router.delete('/:id', authenticate, authorize(['ADMIN', 'ORGANIZER']), deleteEvent);

export default router;
