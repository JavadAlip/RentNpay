import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

/** Orders that include at least one line for this vendor's products. */
const vendorOrderPopulate = [
  { path: 'user', select: 'fullName emailAddress' },
  {
    path: 'products.product',
    select:
      'productName image vendorId brand logisticsVerification category subCategory',
  },
];

export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const productIds = await Product.find({ vendorId }).distinct('_id');
    if (!productIds.length) {
      return res.json([]);
    }
    const orders = await Order.find({ 'products.product': { $in: productIds } })
      .populate(vendorOrderPopulate)
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getVendorOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      vendorOrderPopulate,
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vid = String(req.vendor._id);
    const owns = (order.products || []).some((line) => {
      const p = line.product;
      if (!p || typeof p === 'string') return false;
      return String(p.vendorId) === vid;
    });
    if (!owns) {
      return res
        .status(403)
        .json({ message: 'This order does not include your products' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateVendorOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'products.product',
      'vendorId',
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const vid = String(req.vendor._id);
    const owns = (order.products || []).some((line) => {
      const p = line.product;
      if (!p || typeof p === 'string') return false;
      return String(p.vendorId) === vid;
    });
    if (!owns) {
      return res
        .status(403)
        .json({ message: 'This order does not include your products' });
    }

    if (req.body.status) order.status = req.body.status;
    await order.save();

    const populated = await Order.findById(order._id).populate(
      vendorOrderPopulate,
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
