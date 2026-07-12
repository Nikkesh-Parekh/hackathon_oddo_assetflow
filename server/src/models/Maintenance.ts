import mongoose, { Document, Schema } from 'mongoose';

export enum MaintenanceStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved'
}

export enum MaintenancePriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface IMaintenance extends Document {
  asset: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  issueDescription: string;
  priority: MaintenancePriority;
  photoUrl?: string;
  status: MaintenanceStatus;
  approvedBy?: mongoose.Types.ObjectId;
  technician?: string; // Could be external or internal
  cost?: number;
  resolutionNotes?: string;
}

const maintenanceSchema = new Schema<IMaintenance>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issueDescription: { type: String, required: true },
    priority: {
      type: String,
      enum: Object.values(MaintenancePriority),
      default: MaintenancePriority.MEDIUM
    },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: Object.values(MaintenanceStatus),
      default: MaintenanceStatus.PENDING
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    technician: { type: String },
    cost: { type: Number },
    resolutionNotes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IMaintenance>('Maintenance', maintenanceSchema);
