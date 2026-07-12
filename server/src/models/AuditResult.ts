import mongoose, { Document, Schema } from 'mongoose';

export enum AuditResultStatus {
  VERIFIED = 'Verified',
  MISSING = 'Missing',
  DAMAGED = 'Damaged'
}

export interface IAuditResult extends Document {
  auditCycle: mongoose.Types.ObjectId;
  asset: mongoose.Types.ObjectId;
  auditedBy: mongoose.Types.ObjectId;
  status: AuditResultStatus;
  notes?: string;
}

const auditResultSchema = new Schema<IAuditResult>(
  {
    auditCycle: { type: Schema.Types.ObjectId, ref: 'AuditCycle', required: true },
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    auditedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(AuditResultStatus),
      required: true
    },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IAuditResult>('AuditResult', auditResultSchema);
