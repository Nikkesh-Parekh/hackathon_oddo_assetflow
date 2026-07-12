import express from 'express';
import { 
  getAssets, getAssetById, createAsset, updateAsset, deleteAsset 
} from '../controllers/assetController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/', protect, getAssets);
router.get('/:id', protect, getAssetById);

// Only Admin and Asset Manager can manage assets
router.post('/', protect, authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), createAsset);
router.put('/:id', protect, authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), updateAsset);
router.delete('/:id', protect, authorize(UserRole.ADMIN), deleteAsset);

export default router;
