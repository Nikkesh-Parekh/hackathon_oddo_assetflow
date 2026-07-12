import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserRole } from '../models/User';

export const generateToken = (id: Types.ObjectId | string, role: UserRole) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecret_hackathon_key_2026', {
    expiresIn: '30d',
  });
};
