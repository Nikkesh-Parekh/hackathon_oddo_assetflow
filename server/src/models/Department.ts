import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  head?: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  status: 'Active' | 'Inactive';
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true },
    head: { type: Schema.Types.ObjectId, ref: 'User' },
    parent: { type: Schema.Types.ObjectId, ref: 'Department' },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

export default mongoose.model<IDepartment>('Department', departmentSchema);
