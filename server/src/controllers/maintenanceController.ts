import { Request, Response } from 'express';
import Maintenance, { MaintenanceStatus } from '../models/Maintenance';
import Asset, { AssetStatus } from '../models/Asset';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Raise a maintenance request
// @route   POST /api/maintenance
// @access  Private
export const createMaintenanceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { assetId, issueDescription, priority, photoUrl } = req.body;
    
    const request = await Maintenance.create({
      asset: assetId,
      requestedBy: req.user?._id,
      issueDescription,
      priority,
      photoUrl
    });

    await ActivityLog.create({
      user: req.user?._id,
      action: 'MAINTENANCE_REQUESTED',
      entityType: 'Maintenance',
      entityId: request._id,
      newValue: { status: MaintenanceStatus.PENDING }
    });

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject maintenance
// @route   PUT /api/maintenance/:id/approve
// @access  Private (Asset Manager)
export const reviewMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const { status, technician } = req.body; // Approved or Rejected
    const request = await Maintenance.findById(req.params.id);

    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    request.status = status;
    request.approvedBy = req.user?._id;
    if (technician) request.technician = technician;

    await request.save();

    // Auto update asset status
    const asset = await Asset.findById(request.asset);
    if (asset) {
      if (status === MaintenanceStatus.APPROVED) {
        asset.status = AssetStatus.UNDER_MAINTENANCE;
      }
      await asset.save();
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: `MAINTENANCE_${status.toUpperCase()}`,
      entityType: 'Maintenance',
      entityId: request._id,
      newValue: { status }
    });

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve maintenance
// @route   PUT /api/maintenance/:id/resolve
// @access  Private (Asset Manager)
export const resolveMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const { cost, resolutionNotes } = req.body;
    const request = await Maintenance.findById(req.params.id);

    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    request.status = MaintenanceStatus.RESOLVED;
    request.cost = cost;
    request.resolutionNotes = resolutionNotes;
    await request.save();

    // Revert asset to available
    const asset = await Asset.findById(request.asset);
    if (asset) {
      asset.status = AssetStatus.AVAILABLE;
      await asset.save();
    }

    await ActivityLog.create({
      user: req.user?._id,
      action: 'MAINTENANCE_RESOLVED',
      entityType: 'Maintenance',
      entityId: request._id,
      newValue: { status: MaintenanceStatus.RESOLVED }
    });

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get maintenance requests
// @route   GET /api/maintenance
// @access  Private
export const getMaintenanceRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await Maintenance.find({})
      .populate('asset', 'name assetTag')
      .populate('requestedBy', 'name email');
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
