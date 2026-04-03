import Product from '../../models/Product.js';
import { uploadImageToCloudinary } from '../../config/cloudinaryUpload.js';
import VendorKyc from '../../models/VendorKyc.js';

const parseJsonField = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const deriveStockStatus = (stock) => {
  const s = toNumber(stock, 0);
  if (s <= 0) return 'Out of Stock';
  if (s <= 5) return 'Low Stock';
  return 'Active';
};

const normalizeVariants = (variantsRaw) => {
  const arr = Array.isArray(variantsRaw) ? variantsRaw : [];
  return arr.map((v) => ({
    variantName: String(v?.variantName || '').trim(),
    color: String(v?.color || '').trim(),
    storage: String(v?.storage || '').trim(),
    ram: String(v?.ram || '').trim(),
    condition: String(v?.condition || '').trim(),
    price: String(v?.price || '').trim(),
    stock: toNumber(v?.stock, 0),
  }));
};

const normalizeRentalConfigurations = (raw) => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((cfg) => ({
    months: toNumber(cfg?.months, 1),
    days: toNumber(cfg?.days, 0),
    periodUnit: ['month', 'day'].includes(cfg?.periodUnit)
      ? cfg.periodUnit
      : 'month',
    label: String(cfg?.label || '').trim(),
    pricePerDay: toNumber(cfg?.pricePerDay, 0),
    shippingCharges: toNumber(cfg?.shippingCharges, 0),
    customerRent: toNumber(cfg?.customerRent, 0),
  }));
};

const normalizeLogisticsVerification = (raw) => {
  const o = raw && typeof raw === 'object' ? raw : {};
  return {
    inventoryOwnerName: String(o.inventoryOwnerName || '').trim(),
    city: String(o.city || '').trim(),
    deliveryTimelineValue: toNumber(o.deliveryTimelineValue, 0),
    deliveryTimelineUnit:
      String(o.deliveryTimelineUnit || 'Days').trim() || 'Days',
  };
};

const normalizeProductPayload = (body) => {
  const data = { ...body };
  data.type = 'Rental';
  data.specifications = parseJsonField(body.specifications, {});
  data.variants = normalizeVariants(parseJsonField(body.variants, []));
  data.rentalConfigurations = normalizeRentalConfigurations(
    parseJsonField(body.rentalConfigurations, []),
  );
  data.refundableDeposit = toNumber(body.refundableDeposit, 0);
  data.logisticsVerification = normalizeLogisticsVerification(
    parseJsonField(body.logisticsVerification, {}),
  );
  data.existingImages = parseJsonField(body.existingImages, []);
  data.stock = toNumber(body.stock, 0);
  data.status = deriveStockStatus(data.stock);
  // Creation metadata (optional; forwarded from frontend when available)
  if (body.createdVia === 'manual' || body.createdVia === 'template') {
    data.createdVia = body.createdVia;
  }
  if (
    body.allowVendorEditRentalPrices === true ||
    body.allowVendorEditRentalPrices === 'true'
  ) {
    data.allowVendorEditRentalPrices = true;
  }
  const subs = ['draft', 'pending_approval', 'published'];
  data.submissionStatus = subs.includes(body.submissionStatus)
    ? body.submissionStatus
    : 'published';
  return data;
};

export const createProduct = async (req, res) => {
  try {
    console.log('Vendor:', req.vendor);

    const vendorKyc = await VendorKyc.findOne({ vendorId: req.vendor._id });
    if (!vendorKyc || vendorKyc.status !== 'approved') {
      return res.status(403).json({
        message:
          'KYC not approved yet. Complete KYC and wait for admin approval before adding products.',
      });
    }

    const data = normalizeProductPayload(req.body);
    const uploadedImages = [];

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files.slice(0, 5)) {
        const imgRes = await uploadImageToCloudinary(file.buffer, 'products');
        uploadedImages.push(imgRes.secure_url);
      }
    } else if (req.file) {
      const imgRes = await uploadImageToCloudinary(req.file.buffer, 'products');
      uploadedImages.push(imgRes.secure_url);
    }

    const keptExisting =
      Array.isArray(data.existingImages) && data.existingImages.length > 0
        ? data.existingImages.filter(Boolean).slice(0, 5)
        : [];

    if (uploadedImages.length > 0) {
      data.images = [...keptExisting, ...uploadedImages].slice(0, 5);
      data.image = data.images[0];
    } else if (keptExisting.length > 0) {
      data.images = keptExisting;
      data.image = data.images[0];
    } else if (Array.isArray(data.images) && data.images.length > 0) {
      data.image = data.images[0];
    }

    if (!data.image) {
      if (data.submissionStatus === 'draft') {
        const ph =
          'https://placehold.co/400x400/e5e7eb/6b7280?text=Draft';
        data.image = ph;
        data.images = [ph];
      } else {
        return res
          .status(400)
          .json({ message: 'At least one image is required' });
      }
    }

    delete data.existingImages;

    const product = await Product.create({
      ...data,
      vendorId: req.vendor._id,
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
    const data = normalizeProductPayload(req.body);
    const existing = await Product.findOne({ _id: id, vendorId: req.vendor._id });

    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const uploadedImages = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files.slice(0, 5)) {
        const imgRes = await uploadImageToCloudinary(file.buffer, 'products');
        uploadedImages.push(imgRes.secure_url);
      }
    } else if (req.file) {
      const imgRes = await uploadImageToCloudinary(req.file.buffer, 'products');
      uploadedImages.push(imgRes.secure_url);
    }

    const keptExistingImages = Array.isArray(data.existingImages)
      ? data.existingImages.filter(Boolean)
      : Array.isArray(existing.images)
        ? existing.images
        : existing.image
          ? [existing.image]
          : [];
    const mergedImages = [...keptExistingImages, ...uploadedImages].slice(0, 5);
    data.images = mergedImages;
    data.image = mergedImages[0];

    if (!data.image) {
      return res
        .status(400)
        .json({ message: 'At least one image is required for the product.' });
    }

    delete data.existingImages;

    const product = await Product.findOneAndUpdate(
      { _id: id, vendorId: req.vendor._id },
      data,
      { new: true },
    );

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
    const product = await Product.findById(id).populate(
      'vendorId',
      'fullName emailAddress',
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function pickProductRentalConfigurations(product) {
  const top = product?.rentalConfigurations;
  if (Array.isArray(top) && top.length) return top;
  const v0 = product?.variants?.[0];
  if (
    Array.isArray(v0?.rentalConfigurations) &&
    v0.rentalConfigurations.length
  ) {
    return v0.rentalConfigurations;
  }
  return [];
}

function tierRentAmount(cfg) {
  const n = (k) => {
    const v = Number(String(cfg?.[k] ?? '').replace(/,/g, ''));
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
  return n('customerRent') || n('pricePerDay') || n('vendorRent') || 0;
}

/**
 * Lowest per-month / per-day rate by tenure across other vendors’ rental listings
 * (excludes current vendor). Used in manual product modal “Market low”.
 */
export const getMarketLowRentalTenures = async (req, res) => {
  try {
    const category = String(req.query.category || '').trim();
    const subCategory = String(req.query.subCategory || '').trim();
    const vendorId = req.vendor._id;

    const baseQuery = {
      type: 'Rental',
      submissionStatus: { $in: ['published', 'pending_approval'] },
      vendorId: { $ne: vendorId },
    };

    const narrowQuery = { ...baseQuery };
    if (category) narrowQuery.category = category;
    if (subCategory) narrowQuery.subCategory = subCategory;

    let products = await Product.find(narrowQuery)
      .select('rentalConfigurations variants')
      .lean();

    if ((!products || products.length === 0) && category && subCategory) {
      products = await Product.find({
        ...baseQuery,
        category,
      })
        .select('rentalConfigurations variants')
        .lean();
    }

    if (!products || products.length === 0) {
      products = await Product.find(baseQuery)
        .select('rentalConfigurations variants')
        .lean();
    }

    const monthMin = {};
    const dayMin = {};

    for (const p of products) {
      const configs = pickProductRentalConfigurations(p);
      for (const cfg of configs) {
        const periodUnit = cfg?.periodUnit === 'day' ? 'day' : 'month';
        const amt = tierRentAmount(cfg);
        if (!amt || amt <= 0) continue;

        if (periodUnit === 'day') {
          const days = Number(cfg?.days) || 0;
          if (days <= 0) continue;
          const perDay = amt / days;
          const prev = dayMin[days];
          if (prev == null || perDay < prev) dayMin[days] = perDay;
        } else {
          const months = Number(cfg?.months) || 0;
          if (months <= 0) continue;
          const perMonth = amt / months;
          const prev = monthMin[months];
          if (prev == null || perMonth < prev) monthMin[months] = perMonth;
        }
      }
    }

    const roundMap = (obj) => {
      const out = {};
      for (const k of Object.keys(obj)) {
        out[String(k)] = Math.round(obj[k]);
      }
      return out;
    };

    res.json({
      month: roundMap(monthMin),
      day: roundMap(dayMin),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
