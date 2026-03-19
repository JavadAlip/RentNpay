import express from 'express';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      minPrice,
      maxPrice,
      brand,
      condition,
      availability,
      category,
      search,
    } = req.query;
    const query = {};
    if (search)
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    if (minPrice)
      query.pricePerDay = { ...query.pricePerDay, $gte: Number(minPrice) };
    if (maxPrice)
      query.pricePerDay = { ...query.pricePerDay, $lte: Number(maxPrice) };
    if (brand) query.brand = new RegExp(brand, 'i');
    if (condition) query.condition = condition;
    if (availability) query.availability = availability;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);
    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'category',
      'name slug',
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  '/',
  protect,
  admin,
  upload.array('images', 5),
  async (req, res) => {
    try {
      const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
      const body = { ...req.body, images };
      if (body.pricePerDay) body.pricePerDay = Number(body.pricePerDay);
      const product = await Product.create(body);
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.put(
  '/:id',
  protect,
  admin,
  upload.array('images', 5),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product)
        return res.status(404).json({ message: 'Product not found' });
      const newImages = (req.files || []).map((f) => `/uploads/${f.filename}`);
      const images = newImages.length
        ? [...(product.images || []), ...newImages]
        : product.images;
      const updates = { ...req.body, images };
      if (updates.pricePerDay)
        updates.pricePerDay = Number(updates.pricePerDay);
      Object.assign(product, updates);
      await product.save();
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
