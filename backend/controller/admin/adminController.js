import jwt from 'jsonwebtoken';
import Vendor from '../../models/vendorAuthModel.js';
import Product from '../../models/Product.js';
import User from '../../models/userAuthModel.js';
import Order from '../../models/Order.js';

export const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log('ENV EMAIL:', `"${process.env.ADMIN_EMAIL}"`);
    console.log('ENV PASSWORD:', `"${process.env.ADMIN_PASSWORD}"`);
    console.log('BODY:', `"${identifier}"`, `"${password}"`);

    // ✅ Validation
    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Email and password required',
      });
    }

    // ✅ Simple ENV check
    if (
      identifier !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        message: 'Invalid admin credentials',
      });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { role: 'admin', email: identifier },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        email: identifier,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const adminLogout = async (req, res) => {
  try {
    console.log(' Admin Logout API Hit');

    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    return res.status(200).json({
      message: 'Admin logged out successfully',
    });
  } catch (error) {
    console.error(' Admin logout error:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .select('-password -otp -otpExpire') // 🔥 hide sensitive data
      .sort({ createdAt: -1 });

    const vendorIds = vendors.map((v) => v._id);
    const productCounts = await Product.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      { $group: { _id: '$vendorId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(productCounts.map((x) => [String(x._id), x.count]));

    const withCounts = vendors.map((v) => ({
      ...v.toObject(),
      productsCount: countMap.get(String(v._id)) || 0,
    }));

    res.json({
      vendors: withCounts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('fullName emailAddress createdAt')
      .sort({ createdAt: -1 });

    const userIds = users.map((u) => u._id);
    const orderAgg = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $project: {
          user: 1,
          orderItems: { $sum: '$products.quantity' },
        },
      },
      {
        $group: {
          _id: '$user',
          ordersCount: { $sum: 1 },
          itemsCount: { $sum: '$orderItems' },
        },
      },
    ]);

    const orderMap = new Map(
      orderAgg.map((x) => [
        String(x._id),
        { ordersCount: x.ordersCount || 0, itemsCount: x.itemsCount || 0 },
      ]),
    );

    const result = users.map((u) => {
      const stat = orderMap.get(String(u._id)) || {
        ordersCount: 0,
        itemsCount: 0,
      };
      return {
        _id: u._id,
        fullName: u.fullName,
        emailAddress: u.emailAddress,
        createdAt: u.createdAt,
        ordersCount: stat.ordersCount,
        itemsCount: stat.itemsCount,
      };
    });

    res.json({ users: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category } = req.query;

    const query = {};
    if (search) query.productName = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('vendorId', 'fullName emailAddress')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      products,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
