import jwt from 'jsonwebtoken';
import User from '../models/userAuthModel.js';

export const userAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;

    next();
  } catch (err) {
    console.error('User Auth Error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
