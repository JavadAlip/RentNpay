import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { adminAuth } from '../middleware/auth.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.post('/', userAuth, async (req, res) => {
  try {
    const { products, rentalDuration, tenureUnit, address, phone, name } =
      req.body;
    if (!products?.length || !rentalDuration || !address || !phone || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const unit =
      tenureUnit === 'day' || tenureUnit === 'month' ? tenureUnit : 'month';

    const normalizedLines = [];
    for (const line of products) {
      const productId = line?.product;
      const qty = Math.max(1, Number(line?.quantity || 1));
      if (!productId) continue;

      const product = await Product.findById(productId);
      if (!product) continue;

      const depUnit = Number(product.refundableDeposit || 0);
      normalizedLines.push({
        product: productId,
        productType:
          String(product.type || '').trim() === 'Sell' ? 'Sell' : 'Rental',
        quantity: qty,
        pricePerDay: Number(line.pricePerDay),
        refundableDeposit: Number.isFinite(depUnit) ? depUnit * qty : 0,
      });

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

    if (!normalizedLines.length) {
      return res.status(400).json({ message: 'No valid products in order' });
    }

    const order = await Order.create({
      user: req.user._id,
      products: normalizedLines,
      rentalDuration: Number(rentalDuration),
      tenureUnit: unit,
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
      .populate({
        path: 'products.product',
        populate: { path: 'vendorId', select: 'fullName emailAddress' },
      })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my/:id', userAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('user', 'fullName emailAddress')
      .populate({
        path: 'products.product',
        populate: { path: 'vendorId', select: 'fullName emailAddress' },
      });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/my/:id/extend', userAuth, async (req, res) => {
  try {
    const {
      extensionUnit,
      extensionDuration,
      newUnitRent,
      productId,
    } = req.body || {};

    const unit = extensionUnit === 'day' ? 'day' : 'month';
    const durationInc = Math.max(1, Number(extensionDuration || 0));
    const parsedRent = Number(newUnitRent || 0);

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('products.product');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.status || '').toLowerCase() !== 'delivered') {
      return res
        .status(400)
        .json({ message: 'Only delivered rentals can be extended.' });
    }

    const targetLine = (order.products || []).find((line) => {
      const lineType = String(line?.productType || '').toLowerCase();
      if (lineType === 'sell') return false;
      const p = line?.product;
      if (!p || typeof p === 'string') return false;
      if (String(p?.type || '').toLowerCase() === 'sell') return false;
      if (productId && String(p?._id || '') !== String(productId)) return false;
      return true;
    });

    if (!targetLine || !targetLine.product || typeof targetLine.product === 'string') {
      return res
        .status(400)
        .json({ message: 'No eligible rental line found to extend.' });
    }

    const product = targetLine.product;
    const cfgs = Array.isArray(product?.rentalConfigurations)
      ? product.rentalConfigurations
      : [];
    const matchingTier = cfgs.find((cfg) => {
      const tierUnit = String(cfg?.periodUnit || '').toLowerCase() === 'day'
        ? 'day'
        : 'month';
      if (tierUnit !== unit) return false;
      const tierDuration =
        unit === 'day'
          ? Number(cfg?.days || 0)
          : Number(cfg?.months || 0);
      return tierDuration === durationInc;
    });

    if (!matchingTier) {
      return res.status(400).json({
        message: 'Selected extension plan is not valid for this product.',
      });
    }

    if (parsedRent > 0) {
      const qty = Math.max(1, Number(targetLine.quantity || 1));
      targetLine.pricePerDay = parsedRent / qty;
    }

    order.tenureUnit = unit;
    order.rentalDuration = Math.max(1, Number(order.rentalDuration || 1)) + durationInc;

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('user', 'fullName emailAddress')
      .populate({
        path: 'products.product',
        populate: { path: 'vendorId', select: 'fullName emailAddress' },
      });
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/my/:id/cancel', userAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const st = String(order.status || '');
    if (!['pending', 'confirmed', 'shipped'].includes(st)) {
      return res
        .status(400)
        .json({ message: 'This order cannot be cancelled online.' });
    }
    if (st === 'pending' || st === 'confirmed') {
      for (const line of order.products || []) {
        const pid = line.product;
        const product = await Product.findById(pid);
        if (product) {
          const q = Math.max(1, Number(line.quantity || 1));
          const next = Number(product.stock || 0) + q;
          product.stock = next;
          product.status =
            next <= 0
              ? 'Out of Stock'
              : next <= 5
                ? 'Low Stock'
                : 'Active';
          await product.save();
        }
      }
    }
    order.status = 'cancelled';
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('user', 'fullName emailAddress')
      .populate({
        path: 'products.product',
        populate: { path: 'vendorId', select: 'fullName emailAddress' },
      });
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'fullName emailAddress')
      .populate('products.product', 'productName image type')
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
