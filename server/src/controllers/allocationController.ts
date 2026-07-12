import { Request, Response } from 'express';
import Allocation, { AllocationStatus } from '../models/Allocation';
import Asset, { AssetStatus } from '../models/Asset';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Allocate an asset
// @route   POST /api/allocations
// @access  Private (Asset Manager, Dept Head)
export const allocateAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { assetId, assignedToUser, assignedToDepartment, expectedReturnDate, conditionOut, notes } = req.body;
    
    const asset = await Asset.findById(assetId);
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    if (asset.status !== AssetStatus.AVAILABLE) {
      res.status(409).json({ message: `Asset is currently ${asset.status}. You cannot allocate it.` });
      return;
    }

    const allocation = await Allocation.create({
      asset: assetId,
      assignedToUser,
      assignedToDepartment,
      assignedBy: req.user?._id,
      expectedReturnDate,
      conditionOut,
      notes
    });

    asset.status = AssetStatus.ALLOCATED;
    asset.assignedTo = assignedToUser;
    asset.department = assignedToDepartment;
    await asset.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: 'ALLOCATE_ASSET',
      entityType: 'Asset',
      entityId: assetId,
      newValue: { assignedToUser, assignedToDepartment }
    });

    res.status(201).json(allocation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Return an asset
// @route   POST /api/allocations/:id/return
// @access  Private
export const returnAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { conditionIn, notes } = req.body;
    const allocation = await Allocation.findById(req.params.id);

    if (!allocation || allocation.status === AllocationStatus.RETURNED) {
      res.status(404).json({ message: 'Active allocation not found' });
      return;
    }

    allocation.status = AllocationStatus.RETURNED;
    allocation.returnDate = new Date();
    allocation.conditionIn = conditionIn;
    allocation.notes = notes;
    await allocation.save();

    const asset = await Asset.findById(allocation.asset);
    if (asset) {
      asset.status = AssetStatus.AVAILABLE;
      asset.assignedTo = undefined;
      asset.department = undefined;
      await asset.save();
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: 'RETURN_ASSET',
      entityType: 'Asset',
      entityId: allocation.asset,
      newValue: { status: 'Available' }
    });

    res.json(allocation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get allocations
// @route   GET /api/allocations
// @access  Private
export const getAllocations = async (req: AuthRequest, res: Response) => {
  try {
    const allocations = await Allocation.find({})
      .populate('asset', 'name assetTag')
      .populate('assignedToUser', 'name')
      .populate('assignedToDepartment', 'name')
      .populate('assignedBy', 'name');
    res.json(allocations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
