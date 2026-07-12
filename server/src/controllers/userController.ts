import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get all users (Employee Directory)
// @route   GET /api/users
// @access  Private
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}).populate('department', 'name').select('-password');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role & department (Admin promotes)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { role, department, status } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
      user.role = role || user.role;
      user.department = department || user.department;
      user.status = status || user.status;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        status: updatedUser.status
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const isManager = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.ASSET_MANAGER;
    const query = isManager ? {} : { user: req.user?._id };
    
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
