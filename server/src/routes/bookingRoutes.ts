import express from 'express';
import { 
  createBooking, getBookings, cancelBooking 
} from '../controllers/bookingController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getBookings);
router.post('/', protect, createBooking);
router.put('/:id/cancel', protect, cancelBooking);

export default router;
