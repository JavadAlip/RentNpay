import express from 'express';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { products, rentalDuration, address, phone, name } = req.body;
    if (!products?.length || !rentalDuration || !address || !phone || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const order = await Order.create({
      user: req.user._id,
      products,
      rentalDuration: Number(rentalDuration),
      address,
      phone,
      name
    });
    const populated = await Order.findById(order._id).populate('products.product', 'title images');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    const orders = await Order.find(query).populate('user', 'name email').populate('products.product', 'title images').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/status', protect, admin, async (req, res) => {
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
