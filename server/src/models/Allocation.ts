import mongoose, { Document, Schema } from 'mongoose';

export enum AllocationStatus {
  ACTIVE = 'Active',
  RETURNED = 'Returned',
  TRANSFER_REQUESTED = 'Transfer Requested'
}

export interface IAllocation extends Document {
  asset: mongoose.Types.ObjectId;
  assignedToUser?: mongoose.Types.ObjectId;
  assignedToDepartment?: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  expectedReturnDate?: Date;
  returnDate?: Date;
  status: AllocationStatus;
  conditionOut: string;
  conditionIn?: string;
  notes?: string;
}

const allocationSchema = new Schema<IAllocation>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    assignedToUser: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedToDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expectedReturnDate: { type: Date },
    returnDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(AllocationStatus),
      default: AllocationStatus.ACTIVE
    },
    conditionOut: { type: String, required: true },
    conditionIn: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IAllocation>('Allocation', allocationSchema);
