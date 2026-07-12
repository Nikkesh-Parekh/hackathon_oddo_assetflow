import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

let mongoServer: MongoMemoryServer;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // If a real cloud database URI is provided, attempt connection
  if (uri && !uri.includes('127.0.0.1') && !uri.includes('localhost')) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
      return;
    } catch (error: any) {
      console.warn(`Failed to connect to cloud database: ${error.message}. Falling back to In-Memory DB...`);
    }
  }

  try {
    // Start an in-memory MongoDB instance as fallback
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
    console.log(`Local Database URI: ${mongoUri}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
