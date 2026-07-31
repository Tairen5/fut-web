import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'futweb-secret-key';

export const admin = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};
