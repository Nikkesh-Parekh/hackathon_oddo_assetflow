import { Response } from 'express';
import AuditCycle, { AuditStatus } from '../models/AuditCycle';
import AuditResult, { AuditResultStatus } from '../models/AuditResult';
import Asset from '../models/Asset';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

// @desc    Create an audit cycle
// @route   POST /api/audits/cycles
// @access  Private (Admin, Asset Manager)
export const createAuditCycle = async (req: AuthRequest, res: Response) => {
  try {
    const { name, departmentScope, locationScope, startDate, endDate, auditors } = req.body;
    
    const cycle = await AuditCycle.create({
      name,
      departmentScope: departmentScope || undefined,
      locationScope,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      auditors,
      status: AuditStatus.UPCOMING
    });

    await ActivityLog.create({
      user: req.user?._id,
      action: 'AUDIT_CYCLE_CREATED',
      entityType: 'AuditCycle',
      entityId: cycle._id,
      newValue: { name }
    });

    res.status(201).json(cycle);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all audit cycles
// @route   GET /api/audits/cycles
// @access  Private
export const getAuditCycles = async (req: AuthRequest, res: Response) => {
  try {
    const cycles = await AuditCycle.find({})
      .populate('departmentScope', 'name')
      .populate('auditors', 'name email');
    res.json(cycles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit an audit verification result
// @route   POST /api/audits/results
// @access  Private
export const submitAuditResult = async (req: AuthRequest, res: Response) => {
  try {
    const { auditCycleId, assetId, status, notes } = req.body;

    const cycle = await AuditCycle.findById(auditCycleId);
    if (!cycle) {
      res.status(404).json({ message: 'Audit cycle not found' });
      return;
    }

    // Check authorization: Admin, Asset Manager, or Designated Auditor
    const isManager = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.ASSET_MANAGER;
    const isDesignatedAuditor = cycle.auditors.some(aud => aud.toString() === req.user?._id?.toString());

    if (!isManager && !isDesignatedAuditor) {
      res.status(403).json({ message: 'You are not authorized to audit this cycle. Only designated auditors or managers are allowed.' });
      return;
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    // Check if result already exists for this cycle + asset, update it if so
    let result = await AuditResult.findOne({ auditCycle: auditCycleId, asset: assetId });
    if (result) {
      result.status = status;
      result.notes = notes;
      result.auditedBy = req.user?._id as any;
      await result.save();
    } else {
      result = await AuditResult.create({
        auditCycle: auditCycleId,
        asset: assetId,
        auditedBy: req.user?._id,
        status,
        notes
      });
    }

    // Update asset condition/status if it's missing or damaged
    if (status === AuditResultStatus.MISSING) {
      // Mark as missing or custom state if desired
      asset.condition = 'Needs Repair';
    } else if (status === AuditResultStatus.DAMAGED) {
      asset.condition = 'Broken';
    }
    await asset.save();

    await ActivityLog.create({
      user: req.user?._id,
      action: 'AUDIT_ASSET_VERIFIED',
      entityType: 'Asset',
      entityId: assetId,
      newValue: { status }
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get audit cycle results
// @route   GET /api/audits/cycles/:id/results
// @access  Private
export const getAuditCycleResults = async (req: AuthRequest, res: Response) => {
  try {
    const results = await AuditResult.find({ auditCycle: req.params.id })
      .populate('asset', 'name assetTag condition status')
      .populate('auditedBy', 'name');
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
