import { Request, Response } from 'express';
import Department from '../models/Department';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/authMiddleware';

// --- DEPARTMENTS ---

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const departments = await Department.find({}).populate('head', 'name email');
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { name, head, parent, status } = req.body;
    const departmentExists = await Department.findOne({ name });
    if (departmentExists) {
      res.status(409).json({ message: 'Department already exists' });
      return;
    }
    const department = await Department.create({ name, head, parent, status });
    res.status(201).json(department);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
export const updateDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (department) {
      res.json(department);
    } else {
      res.status(404).json({ message: 'Department not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- CATEGORIES ---

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, customFields } = req.body;
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      res.status(409).json({ message: 'Category already exists' });
      return;
    }
    const category = await Category.create({ name, description, customFields });
    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
