import mongoose, { Document, Schema } from 'mongoose';

export enum BookingStatus {
  UPCOMING = 'Upcoming',
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface IBooking extends Document {
  asset: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  notes?: string;
}

const bookingSchema = new Schema<IBooking>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.UPCOMING
    },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>('Booking', bookingSchema);
