import mongoose, { Document, Schema } from 'mongoose';

export enum AuditStatus {
  UPCOMING = 'Upcoming',
  ONGOING = 'Ongoing',
  CLOSED = 'Closed'
}

export interface IAuditCycle extends Document {
  name: string;
  departmentScope?: mongoose.Types.ObjectId;
  locationScope?: string;
  startDate: Date;
  endDate: Date;
  auditors: mongoose.Types.ObjectId[];
  status: AuditStatus;
  discrepancyReportUrl?: string; // Optional URL for generated report
}

const auditCycleSchema = new Schema<IAuditCycle>(
  {
    name: { type: String, required: true },
    departmentScope: { type: Schema.Types.ObjectId, ref: 'Department' },
    locationScope: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    auditors: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    status: {
      type: String,
      enum: Object.values(AuditStatus),
      default: AuditStatus.UPCOMING
    },
    discrepancyReportUrl: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IAuditCycle>('AuditCycle', auditCycleSchema);
