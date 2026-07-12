import express from 'express';
import { getUsers, updateUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/', protect, getUsers);
router.put('/:id', protect, authorize(UserRole.ADMIN), updateUser);

export default router;
