import { Request, Response } from 'express';
import Allocation, { AllocationStatus } from '../models/Allocation';
import Asset, { AssetStatus } from '../models/Asset';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

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
      // Find the active allocation to see who currently holds it
      const currentAlloc = await Allocation.findOne({ asset: assetId, status: AllocationStatus.ACTIVE })
        .populate('assignedToUser', 'name')
        .populate('assignedToDepartment', 'name');

      let holderName = 'Unknown';
      let holderDept = '';
      let holderReturnDate = '';
      if (currentAlloc) {
        if (currentAlloc.assignedToUser) {
          holderName = (currentAlloc.assignedToUser as any).name;
          holderDept = (currentAlloc.assignedToUser as any).department?.name || '';
        } else if (currentAlloc.assignedToDepartment) {
          holderName = (currentAlloc.assignedToDepartment as any).name;
          holderDept = (currentAlloc.assignedToDepartment as any).name;
        }
        holderReturnDate = currentAlloc.expectedReturnDate?.toISOString() || '';
      }

      res.status(409).json({ 
        message: `Asset is currently held by ${holderName}.`,
        allocationId: currentAlloc?._id,
        currentHolder: holderName,
        department: holderDept,
        expectedReturnDate: holderReturnDate,
      });
      return;

    }

    const allocation = await Allocation.create({
      asset: assetId,
      assignedToUser: assignedToUser || undefined,
      assignedToDepartment: assignedToDepartment || undefined,
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

// @desc    Request a transfer
// @route   POST /api/allocations/:id/transfer
// @access  Private
export const requestTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { transferNotes } = req.body;
    const allocation = await Allocation.findById(req.params.id);

    if (!allocation || allocation.status !== AllocationStatus.ACTIVE) {
      res.status(404).json({ message: 'Active allocation not found for transfer.' });
      return;
    }

    allocation.status = AllocationStatus.TRANSFER_REQUESTED;
    allocation.transferRequestedBy = req.user?._id as any;
    allocation.transferNotes = transferNotes;
    await allocation.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: 'TRANSFER_REQUESTED',
      entityType: 'Asset',
      entityId: allocation.asset,
      newValue: { requestedBy: req.user?._id }
    });

    res.json(allocation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review a transfer request (Approve/Reject)
// @route   POST /api/allocations/:id/transfer/review
// @access  Private (Asset Manager, Dept Head)
export const reviewTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { action, conditionIn, notes } = req.body; // 'approve' or 'reject'
    const allocation = await Allocation.findById(req.params.id);

    if (!allocation || allocation.status !== AllocationStatus.TRANSFER_REQUESTED) {
      res.status(404).json({ message: 'Pending transfer request not found.' });
      return;
    }

    if (action === 'approve') {
      // 1. Close current allocation as Returned
      allocation.status = AllocationStatus.RETURNED;
      allocation.returnDate = new Date();
      allocation.conditionIn = conditionIn || 'Good';
      allocation.notes = notes || 'Transferred out';
      await allocation.save();

      // 2. Create new active allocation for requester
      const newAllocation = await Allocation.create({
        asset: allocation.asset,
        assignedToUser: allocation.transferRequestedBy,
        assignedBy: req.user?._id,
        status: AllocationStatus.ACTIVE,
        conditionOut: conditionIn || 'Good',
        notes: `Transferred. Original notes: ${allocation.transferNotes || ''}`
      });

      // 3. Update asset assignedTo
      const asset = await Asset.findById(allocation.asset);
      if (asset) {
        asset.status = AssetStatus.ALLOCATED;
        asset.assignedTo = allocation.transferRequestedBy;
        asset.department = undefined;
        await asset.save();
      }

      await ActivityLog.create({
        user: req.user?._id,
        action: 'TRANSFER_APPROVED',
        entityType: 'Asset',
        entityId: allocation.asset,
        newValue: { newHolder: allocation.transferRequestedBy }
      });

      res.json({ message: 'Transfer approved', allocation: newAllocation });
    } else {
      // Reject: Revert status to active and clear transfer requests
      allocation.status = AllocationStatus.ACTIVE;
      allocation.transferRequestedBy = undefined;
      allocation.transferNotes = undefined;
      await allocation.save();

      await ActivityLog.create({
        user: req.user?._id,
        action: 'TRANSFER_REJECTED',
        entityType: 'Asset',
        entityId: allocation.asset,
        newValue: { status: 'Active' }
      });

      res.json({ message: 'Transfer request rejected', allocation });
    }
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
    const isManager = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.ASSET_MANAGER;
    // If not manager, only find checkouts assigned to this user or their department
    const query = isManager 
      ? {} 
      : { 
          $or: [
            { assignedToUser: req.user?._id },
            ...(req.user?.department ? [{ assignedToDepartment: req.user.department }] : [])
          ]
        };

    const allocations = await Allocation.find(query)
      .populate('asset', 'name assetTag')
      .populate('assignedToUser', 'name')
      .populate('assignedToDepartment', 'name')
      .populate('assignedBy', 'name');
    res.json(allocations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
