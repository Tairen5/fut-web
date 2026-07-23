import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import squadRoutes from './routes/squadRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import userPlayerRoutes from './routes/userPlayerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import packRoutes from './routes/packRoutes.js';
import matchRoutes from './routes/matchRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/squad', squadRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/user-players', userPlayerRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/matches', matchRoutes);

app.get('/', (req, res) => {
  res.send('FUT Web API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
