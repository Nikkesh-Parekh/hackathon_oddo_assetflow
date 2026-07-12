import express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import orgRoutes from './orgRoutes';
import assetRoutes from './assetRoutes';
// To be implemented:
// import allocationRoutes from './allocationRoutes';
// import bookingRoutes from './bookingRoutes';
// import maintenanceRoutes from './maintenanceRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/org', orgRoutes);
router.use('/assets', assetRoutes);

export default router;
