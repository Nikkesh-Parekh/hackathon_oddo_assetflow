import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  customFields?: { name: string; type: string }[];
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    customFields: [
      {
        name: { type: String },
        type: { type: String, enum: ['text', 'number', 'date', 'boolean'] }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', categorySchema);
