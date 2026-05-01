import { Router } from 'express';
import { getUsers, updateUser, deleteUser, updateProfile, getMe } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Profile routes (Any authenticated user)
router.get('/me', getMe);
router.put('/update-profile', updateProfile);

// Admin routes
router.get('/', authorize(['ADMIN']), getUsers);
router.put('/:id', authorize(['ADMIN']), updateUser);
router.delete('/:id', authorize(['ADMIN']), deleteUser);

export default router;
