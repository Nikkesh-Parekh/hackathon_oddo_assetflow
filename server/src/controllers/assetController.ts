import { Request, Response } from 'express';
import Asset from '../models/Asset';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
export const getAssets = async (req: AuthRequest, res: Response) => {
  try {
    const filters = req.query; // basic filter support
    const assets = await Asset.find(filters)
      .populate('category', 'name')
      .populate('department', 'name')
      .populate('assignedTo', 'name email');
    res.json(assets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get asset by ID
// @route   GET /api/assets/:id
// @access  Private
export const getAssetById = async (req: AuthRequest, res: Response) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('category')
      .populate('department')
      .populate('assignedTo');
    if (asset) {
      res.json(asset);
    } else {
      res.status(404).json({ message: 'Asset not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register new asset
// @route   POST /api/assets
// @access  Private (Asset Manager, Admin)
export const createAsset = async (req: AuthRequest, res: Response) => {
  try {
    const assetExists = await Asset.findOne({ assetTag: req.body.assetTag });
    if (assetExists) {
      res.status(409).json({ message: 'Asset Tag already exists' });
      return;
    }
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Private (Asset Manager, Admin)
export const updateAsset = async (req: AuthRequest, res: Response) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (asset) {
      res.json(asset);
    } else {
      res.status(404).json({ message: 'Asset not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an asset (or mark retired)
// @route   DELETE /api/assets/:id
// @access  Private (Admin)
export const deleteAsset = async (req: AuthRequest, res: Response) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (asset) {
      asset.status = 'Disposed' as any;
      await asset.save();
      res.json({ message: 'Asset marked as disposed' });
    } else {
      res.status(404).json({ message: 'Asset not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
