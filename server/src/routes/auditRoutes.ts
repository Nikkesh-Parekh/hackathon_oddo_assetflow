import express from 'express';
import { 
  createAuditCycle, getAuditCycles, submitAuditResult, getAuditCycleResults 
} from '../controllers/auditController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/cycles', protect, getAuditCycles);
router.post('/cycles', protect, authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), createAuditCycle);
router.post('/results', protect, submitAuditResult);
router.get('/cycles/:id/results', protect, getAuditCycleResults);

export default router;
