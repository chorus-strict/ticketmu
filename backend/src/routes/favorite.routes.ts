import { Router } from 'express';
import { toggleFavorite, getUserFavorites, getIsFavorited } from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getUserFavorites);
router.post('/:eventId/toggle', toggleFavorite);
router.get('/:eventId/status', getIsFavorited);

export default router;
