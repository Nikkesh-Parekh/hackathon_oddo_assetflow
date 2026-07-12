import express from 'express';
import { 
  createMaintenanceRequest, reviewMaintenance, resolveMaintenance, getMaintenanceRequests 
} from '../controllers/maintenanceController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/', protect, getMaintenanceRequests);
router.post('/', protect, createMaintenanceRequest);
router.put('/:id/approve', protect, authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), reviewMaintenance);
router.put('/:id/resolve', protect, authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), resolveMaintenance);

export default router;
