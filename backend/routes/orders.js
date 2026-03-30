import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { adminAuth } from '../middleware/Auth.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.post('/', userAuth, async (req, res) => {
  try {
    const { products, rentalDuration, address, phone, name } = req.body;
    if (!products?.length || !rentalDuration || !address || !phone || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Reduce live inventory based on ordered quantity, and update stock status.
    for (const line of products) {
      const productId = line?.product;
      const qty = Math.max(0, Number(line?.quantity || 0));
      if (!productId || qty <= 0) continue;

      const product = await Product.findById(productId);
      if (!product) continue;

      const nextStock = Math.max(0, Number(product.stock || 0) - qty);
      product.stock = nextStock;
      product.status =
        nextStock <= 0
          ? 'Out of Stock'
          : nextStock <= 5
            ? 'Low Stock'
            : 'Active';
      await product.save();
    }

    const order = await Order.create({
      user: req.user._id,
      products,
      rentalDuration: Number(rentalDuration),
      address,
      phone,
      name,
    });
    const populated = await Order.findById(order._id).populate(
      'products.product',
      'productName image',
    );
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', userAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('user', 'fullName emailAddress')
      .populate('products.product', 'productName image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'fullName emailAddress')
      .populate('products.product', 'productName image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.body.status) order.status = req.body.status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
