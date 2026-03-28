import SubCategory from '../../models/SubCategory.js';
import Category from '../../models/Category.js';
import Product from '../../models/Product.js';
import Offer from '../../models/Offer.js';
import { uploadImageToCloudinary } from '../../config/cloudinaryUpload.js';
import { slugify } from './categoryController.js';

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

export const createSubCategory = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      slug: slugIn,
      commissionRate,
      otherTax,
      operations: opsRaw,
    } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: 'Parent category is required' });
    }
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

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
        'subcategories',
      );
      image = imgRes.secure_url;
    }
    if (iconFile) {
      const iconRes = await uploadImageToCloudinary(
        iconFile.buffer,
        'subcategories/icons',
      );
      icon = iconRes.secure_url;
    }

    if (image && !icon) icon = image;
    if (icon && !image) image = icon;

    const baseSlug = (slugIn && String(slugIn).trim()) || slugify(name);
    let slug = baseSlug || `sub-${Date.now()}`;
    let suffix = 0;
    while (await SubCategory.findOne({ category: categoryId, slug })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const subCategory = await SubCategory.create({
      name: name.trim(),
      slug,
      category: categoryId,
      image: image || '',
      icon: icon || '',
      availableInRent,
      availableInBuy,
      availableInServices,
      commissionRate: cr,
      otherTax: ot,
      operations,
    });

    res.status(201).json({
      message: 'SubCategory created',
      subCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const data = await SubCategory.find({
      category: categoryId,
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
      return res.status(404).json({ message: 'SubCategory not found' });
    }

    const parent = await Category.findById(subCategory.category);
    const parentName = String(parent?.name || '').trim();
    const subName = String(subCategory.name || '').trim();

    let productFilter = { _id: null };
    if (parentName && subName) {
      productFilter = {
        category: new RegExp(`^${escapeRegex(parentName)}$`, 'i'),
        subCategory: new RegExp(`^${escapeRegex(subName)}$`, 'i'),
      };
    } else if (subName) {
      productFilter = {
        subCategory: new RegExp(`^${escapeRegex(subName)}$`, 'i'),
      };
    }

    const { deletedProducts, deletedOffers } =
      await deleteProductsAndOffersByFilter(productFilter);

    await SubCategory.findByIdAndDelete(id);

    res.json({
      message:
        'Sub-category and products using it were removed successfully',
      deletedProducts,
      deletedOffers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
