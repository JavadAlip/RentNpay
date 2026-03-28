import Category from '../../models/Category.js';
import SubCategory from '../../models/SubCategory.js';
import Product from '../../models/Product.js';
import Offer from '../../models/Offer.js';

import { uploadImageToCloudinary } from '../../config/cloudinaryUpload.js';

export const slugify = (text) =>
  String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const parseBool = (v, defaultVal = false) => {
  if (v === undefined || v === null || v === '') return defaultVal;
  return v === true || v === 'true' || v === '1';
};

const parseOperations = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const platformFlag = (platform) => {
  const p = String(platform || 'rent').toLowerCase();
  if (p === 'buy' || p === 'selling') return 'availableInBuy';
  if (p === 'services' || p === 'service') return 'availableInServices';
  return 'availableInRent';
};

const matchesPlatform = (doc, flag) => {
  if (!doc) return false;
  const v = doc[flag];
  if (v === undefined || v === null) return true;
  return v === true;
};

export const getMasterCategories = async (req, res) => {
  try {
    const flag = platformFlag(req.query.platform);
    const categories = await Category.find().sort({ name: 1 }).lean();
    const subCategories = await SubCategory.find().populate('category').sort({ name: 1 }).lean();

    const filteredCats = categories.filter((c) => matchesPlatform(c, flag));
    const filteredSubs = subCategories.filter(
      (s) =>
        matchesPlatform(s, flag) &&
        s.category &&
        matchesPlatform(s.category, flag),
    );

    const tree = filteredCats.map((c) => ({
      ...c,
      subCategories: filteredSubs.filter(
        (s) => String(s.category._id) === String(c._id),
      ),
    }));

    const totalMain = filteredCats.length;
    const totalSubs = filteredSubs.length;

    const p = String(req.query.platform || 'rent').toLowerCase();
    let productQuery = { status: 'Active' };
    if (p === 'buy' || p === 'selling') productQuery.type = 'Sell';
    else if (p === 'services' || p === 'service') {
      // Product schema currently has Rental | Sell only; broaden when service SKUs exist.
      productQuery = { status: 'Active' };
    } else {
      productQuery.type = 'Rental';
    }

    const activeProducts = await Product.countDocuments(productQuery);

    res.json({
      tree,
      stats: {
        totalMain,
        totalSubs,
        activeProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug: slugIn, commissionRate, otherTax, operations: opsRaw } =
      req.body;

    const availableInRent = parseBool(req.body.availableInRent, true);
    const availableInBuy = parseBool(req.body.availableInBuy, false);
    const availableInServices = parseBool(req.body.availableInServices, false);

    let operations = parseOperations(opsRaw);
    const cr = Number(commissionRate) || 0;
    const ot = Number(otherTax) || 0;
    if (!operations.length) {
      operations = [{ commissionRate: cr, otherTax: ot }];
    }

    const imageFile = req.files?.image?.[0];
    const iconFile = req.files?.icon?.[0];

    let image = '';
    let icon = '';

    if (imageFile) {
      const imgRes = await uploadImageToCloudinary(
        imageFile.buffer,
        'categories',
      );
      image = imgRes.secure_url;
    }
    if (iconFile) {
      const iconRes = await uploadImageToCloudinary(
        iconFile.buffer,
        'categories/icons',
      );
      icon = iconRes.secure_url;
    }

    if (!image && !icon) {
      return res
        .status(400)
        .json({ message: 'Upload a category image and/or icon' });
    }
    if (!image) image = icon;
    if (!icon) icon = image;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const slug = (slugIn && String(slugIn).trim()) || slugify(name);
    if (!slug) {
      return res.status(400).json({ message: 'Valid slug is required' });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      image,
      icon,
      availableInRent,
      availableInBuy,
      availableInServices,
      commissionRate: cr,
      otherTax: ot,
      operations,
    });

    res.status(201).json({
      message: 'Category created',
      category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const data = await Category.find().sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Products store category / subCategory as strings (vendor UI names); match case-insensitively. */
async function deleteProductsAndOffersByFilter(filter) {
  const productIds = await Product.find(filter).distinct('_id');
  if (!productIds.length) {
    return { deletedProducts: 0, deletedOffers: 0 };
  }
  const offersRes = await Offer.deleteMany({ productId: { $in: productIds } });
  const prodRes = await Product.deleteMany({ _id: { $in: productIds } });
  return {
    deletedProducts: prodRes.deletedCount || 0,
    deletedOffers: offersRes.deletedCount || 0,
  };
}

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const catName = String(category.name || '').trim();
    const productFilter = catName
      ? { category: new RegExp(`^${escapeRegex(catName)}$`, 'i') }
      : { _id: null };

    const { deletedProducts, deletedOffers } =
      await deleteProductsAndOffersByFilter(productFilter);

    await SubCategory.deleteMany({ category: id });

    await Category.findByIdAndDelete(id);

    res.json({
      message:
        'Category, sub-categories, and linked products were removed successfully',
      deletedProducts,
      deletedOffers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
