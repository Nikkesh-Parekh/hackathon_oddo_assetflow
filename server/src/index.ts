import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import routes from './routes';
import { seedDatabase } from './utils/seed';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', routes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('AssetFlow API is running...');
});

const startServer = async () => {
  await connectDB();
  await seedDatabase();

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
};

startServer();
