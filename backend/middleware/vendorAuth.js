import jwt from 'jsonwebtoken';
import Vendor from '../models/vendorAuthModel.js';

export const vendorAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const vendor = await Vendor.findById(decoded.vendorId);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    req.vendor = vendor;

    next();
  } catch (err) {
    console.error('Vendor Auth Error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
