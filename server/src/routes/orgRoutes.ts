import express from 'express';
import { 
  getDepartments, createDepartment, updateDepartment,
  getCategories, createCategory, updateCategory
} from '../controllers/orgController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Departments
router.get('/departments', protect, getDepartments);
router.post('/departments', protect, authorize(UserRole.ADMIN), createDepartment);
router.put('/departments/:id', protect, authorize(UserRole.ADMIN), updateDepartment);

// Categories
router.get('/categories', protect, getCategories);
router.post('/categories', protect, authorize(UserRole.ADMIN), createCategory);
router.put('/categories/:id', protect, authorize(UserRole.ADMIN), updateCategory);

export default router;
