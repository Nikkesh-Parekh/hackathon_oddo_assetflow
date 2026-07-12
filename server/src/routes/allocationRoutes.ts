import express from 'express';
import { 
  allocateAsset, returnAsset, getAllocations 
} from '../controllers/allocationController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/', protect, getAllocations);
router.post('/', protect, authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), allocateAsset);
router.post('/:id/return', protect, returnAsset);

export default router;
