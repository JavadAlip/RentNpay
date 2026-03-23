import Product from '../../models/Product.js';
import { uploadImageToCloudinary } from '../../config/cloudinaryUpload.js';

export const createProduct = async (req, res) => {
  try {
    console.log('Vendor:', req.vendor);

    const data = req.body;

    if (req.file) {
      const imgRes = await uploadImageToCloudinary(req.file.buffer, 'products');
      data.image = imgRes.secure_url;
    }

    if (!data.image) {
      return res.status(400).json({ message: 'Image required' });
    }

    const product = await Product.create({
      ...data,
      vendorId: req.vendor._id, // ✅ FIXED
    });

    res.status(201).json({
      message: 'Product created',
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      vendorId: req.vendor._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let data = req.body;

    if (req.file) {
      const imgRes = await uploadImageToCloudinary(req.file.buffer, 'products');
      data.image = imgRes.secure_url;
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, vendorId: req.vendor._id },
      data,
      { new: true },
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      message: 'Updated successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOneAndDelete({
      _id: id,
      vendorId: req.vendor._id,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      message: 'Deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
