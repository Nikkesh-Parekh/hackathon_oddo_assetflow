import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  ADMIN = 'Admin',
  ASSET_MANAGER = 'Asset Manager',
  DEPARTMENT_HEAD = 'Department Head',
  EMPLOYEE = 'Employee',
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  department?: mongoose.Types.ObjectId;
  role: UserRole;
  status: 'Active' | 'Inactive';
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    role: { 
      type: String, 
      enum: Object.values(UserRole), 
      default: UserRole.EMPLOYEE 
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
