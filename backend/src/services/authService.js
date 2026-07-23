import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'futweb-secret-key';

export const register = async (username, password) => {
  const existing = await User.findOne({ username });
  if (existing) throw new Error('Username already exists.');

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hashed });

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { _id: user._id, username: user.username, currency: user.currency, points: user.points, elo: user.elo, record: user.record } };
};

export const login = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) throw new Error('Invalid credentials.');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials.');

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { _id: user._id, username: user.username, currency: user.currency, points: user.points, elo: user.elo, record: user.record } };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found.');
  return user;
};
