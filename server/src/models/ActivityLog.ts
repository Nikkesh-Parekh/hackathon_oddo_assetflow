import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string; // e.g., 'REGISTER_ASSET', 'APPROVE_MAINTENANCE'
  entityType: string; // e.g., 'Asset', 'Maintenance', 'Booking'
  entityId: mongoose.Types.ObjectId;
  previousValue?: any;
  newValue?: any;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed }
  },
  { timestamps: { updatedAt: false } } // Only need createdAt
);

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
