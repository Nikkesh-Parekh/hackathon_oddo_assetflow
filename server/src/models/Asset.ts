import mongoose, { Document, Schema } from 'mongoose';

export enum AssetStatus {
  AVAILABLE = 'Available',
  ALLOCATED = 'Allocated',
  RESERVED = 'Reserved',
  UNDER_MAINTENANCE = 'Under Maintenance',
  LOST = 'Lost',
  RETIRED = 'Retired',
  DISPOSED = 'Disposed'
}

export interface IAsset extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  assetTag: string;
  serialNumber?: string;
  acquisitionDate?: Date;
  acquisitionCost?: number;
  condition: string;
  location: string;
  photoUrl?: string;
  isSharedBookable: boolean;
  status: AssetStatus;
  department?: mongoose.Types.ObjectId; // Current assigned department if any
  assignedTo?: mongoose.Types.ObjectId; // Current assigned user if any
}

const assetSchema = new Schema<IAsset>(
  {
    name: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    assetTag: { type: String, required: true, unique: true },
    serialNumber: { type: String },
    acquisitionDate: { type: Date },
    acquisitionCost: { type: Number },
    condition: { type: String, default: 'Good' },
    location: { type: String, required: true },
    photoUrl: { type: String },
    isSharedBookable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      default: AssetStatus.AVAILABLE
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model<IAsset>('Asset', assetSchema);
