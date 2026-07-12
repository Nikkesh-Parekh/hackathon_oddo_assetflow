import express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import orgRoutes from './orgRoutes';
import assetRoutes from './assetRoutes';
import allocationRoutes from './allocationRoutes';
import bookingRoutes from './bookingRoutes';
import maintenanceRoutes from './maintenanceRoutes';
import auditRoutes from './auditRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/org', orgRoutes);
router.use('/assets', assetRoutes);
router.use('/allocations', allocationRoutes);
router.use('/bookings', bookingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/audits', auditRoutes);

export default router;
