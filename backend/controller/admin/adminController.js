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

export const getVendorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id).select(
      'fullName emailAddress isVerified createdAt',
    );
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: id }).sort({ createdAt: -1 });
    const productIds = products.map((p) => p._id);

    const orders = await Order.find({
      'products.product': { $in: productIds },
    })
      .populate('products.product', 'productName vendorId category type')
      .sort({ createdAt: -1 });

    let totalEarnings = 0;
    let pendingSettlement = 0;
    const transactions = [];

    orders.forEach((order) => {
      const rentalDuration = Number(order.rentalDuration || 0);
      let orderVendorAmount = 0;

      (order.products || []).forEach((item) => {
        const p = item.product;
        if (!p || String(p.vendorId) !== String(id)) return;
        orderVendorAmount +=
          Number(item.pricePerDay || 0) *
          Number(item.quantity || 0) *
          rentalDuration;
      });

      if (orderVendorAmount > 0) {
        totalEarnings += orderVendorAmount;
        if (!['delivered', 'cancelled'].includes(String(order.status || ''))) {
          pendingSettlement += orderVendorAmount;
        }
        transactions.push({
          _id: order._id,
          date: order.createdAt,
          amount: orderVendorAmount,
          status: order.status,
          description: 'Rental order payout',
        });
      }
    });

    const activeProducts = products.filter((p) => Number(p.stock || 0) > 0).length;
    const summary = {
      totalEarnings,
      activeProducts,
      pendingSettlement,
      totalProducts: products.length,
    };

    res.json({
      vendor: {
        _id: vendor._id,
        fullName: vendor.fullName,
        emailAddress: vendor.emailAddress,
        isVerified: vendor.isVerified,
        createdAt: vendor.createdAt,
        vendorCode: `VEN-${String(vendor._id).slice(-4).toUpperCase()}`,
      },
      summary,
      products: products.map((p) => ({
        _id: p._id,
        productName: p.productName,
        category: p.category,
        type: p.type,
        price: p.price,
        stock: p.stock,
        status: p.status,
        image: p.image,
      })),
      kycDocuments: [],
      financials: {
        totalEarnings,
        pendingSettlement,
        lastSettlement: Math.round(totalEarnings * 0.03),
      },
      recentTransactions: transactions.slice(0, 8),
      loanHistory: [],
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

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('fullName emailAddress createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const orders = await Order.find({ user: id })
      .populate('products.product', 'productName image category type')
      .sort({ createdAt: -1 });

    const today = new Date();
    const activeRentals = [];
    const orderHistory = [];
    let totalAmount = 0;
    let totalRentAmount = 0;
    let totalDeposit = 0;
    let totalShipping = 0;

    orders.forEach((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
      const rentalDuration = Number(order.rentalDuration || 0);
      const endAt = new Date(createdAt);
      endAt.setMonth(endAt.getMonth() + rentalDuration);

      const orderAmount = (order.products || []).reduce((sum, item) => {
        return (
          sum +
          Number(item.pricePerDay || 0) *
            Number(item.quantity || 0) *
            rentalDuration
        );
      }, 0);

      totalAmount += orderAmount;
      totalRentAmount += orderAmount;
      totalDeposit += Math.round(orderAmount * 0.1);
      totalShipping += Math.round(orderAmount * 0.02);

      orderHistory.push({
        _id: order._id,
        date: order.createdAt,
        amount: orderAmount,
        status: order.status,
        description:
          order.products
            ?.map((p) => p.product?.productName)
            .filter(Boolean)
            .join(', ') || 'Rental order',
      });

      if (endAt >= today && !['cancelled', 'delivered'].includes(String(order.status))) {
        (order.products || []).forEach((item) => {
          const totalMonths = rentalDuration;
          const elapsedMonths = Math.max(
            0,
            Math.min(
              totalMonths,
              Math.floor(
                (today.getTime() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000),
              ),
            ),
          );
          const monthlyAmount =
            Number(item.pricePerDay || 0) * Number(item.quantity || 0);
          activeRentals.push({
            orderId: order._id,
            productName: item.product?.productName || 'Product',
            startDate: createdAt,
            endDate: endAt,
            totalMonths,
            elapsedMonths,
            monthsLeft: Math.max(0, totalMonths - elapsedMonths),
            monthlyAmount,
            rentAmount: monthlyAmount * totalMonths,
            deposit: Math.round(monthlyAmount * 0.1),
          });
        });
      }
    });

    const tenureMonths = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000),
      ),
    );

    res.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        createdAt: user.createdAt,
        customerCode: `CUST-${String(user._id).slice(-4).toUpperCase()}`,
      },
      summary: {
        tenureMonths,
        totalOrders: orders.length,
        totalAmount,
        activeRentals: activeRentals.length,
      },
      financials: {
        rent: totalRentAmount,
        deposit: totalDeposit,
        shipping: totalShipping,
      },
      activeRentals,
      orderHistory,
      kycDocuments: [],
      supportTickets: [],
    });
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
