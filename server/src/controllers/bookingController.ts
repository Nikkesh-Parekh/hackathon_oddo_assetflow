import { Request, Response } from 'express';
import Booking, { BookingStatus } from '../models/Booking';
import Asset from '../models/Asset';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Book a resource
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { assetId, startTime, endTime, notes } = req.body;
    
    const asset = await Asset.findById(assetId);
    if (!asset || !asset.isSharedBookable) {
      res.status(400).json({ message: 'Asset is not available for shared booking' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Overlap validation
    const overlappingBooking = await Booking.findOne({
      asset: assetId,
      status: { $in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
      $and: [
        { startTime: { $lt: end } },
        { endTime: { $gt: start } }
      ]
    });

    if (overlappingBooking) {
      res.status(409).json({ message: 'Resource is already booked during this time slot.' });
      return;
    }

    const booking = await Booking.create({
      asset: assetId,
      user: req.user?._id,
      startTime: start,
      endTime: end,
      notes
    });

    res.status(201).json(booking);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({})
      .populate('asset', 'name location')
      .populate('user', 'name email');
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Only allow cancellation by the user who booked or admin
    if (booking.user.toString() !== req.user?._id?.toString() && req.user?.role !== 'Admin') {
      res.status(403).json({ message: 'Not authorized to cancel this booking' });
      return;
    }

    booking.status = BookingStatus.CANCELLED;
    await booking.save();
    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
