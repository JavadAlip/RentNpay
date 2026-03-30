import mongoose from 'mongoose';
import Wishlist from '../../models/Wishlist.js';
import Product from '../../models/Product.js';

export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findById(productId).select('_id');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existing = await Wishlist.findOne({
      userId: req.user._id,
      productId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ wished: false, productId });
    }

    await Wishlist.create({ userId: req.user._id, productId });
    return res.json({ wished: true, productId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyWishlist = async (req, res) => {
  try {
    const rows = await Wishlist.find({ userId: req.user._id })
      .populate({
        path: 'productId',
        populate: { path: 'vendorId', select: 'fullName emailAddress' },
      })
      .sort({ createdAt: -1 });

    const items = rows
      .map((r) => r.productId)
      .filter(Boolean)
      .filter((p) => p.submissionStatus !== 'draft');

    const wishedProductIds = items.map((p) => String(p._id));
    res.json({ items, wishedProductIds });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

