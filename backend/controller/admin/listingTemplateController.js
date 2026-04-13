import ListingTemplate from '../../models/ListingTemplate.js';
import { uploadImageToCloudinary } from '../../config/cloudinaryUpload.js';

const MAX_UPLOAD_FILES = 40;

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

const normalizeLabelValueRows = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      label: String(r?.label || '').trim(),
      value: String(r?.value || '').trim(),
    }))
    .filter((r) => r.label || r.value);

const normalizeRentalTiers = (raw) =>
  (Array.isArray(raw) ? raw : []).map((cfg) => {
    const periodUnit = cfg?.periodUnit === 'day' ? 'day' : 'month';
    return {
      months: toNumber(cfg?.months, 0),
      days: toNumber(cfg?.days, 0),
      periodUnit,
      label: String(cfg?.label || '').trim(),
      tierLabel: String(cfg?.tierLabel || '').trim(),
      pricePerDay: toNumber(cfg?.pricePerDay, 0),
      customerRent: toNumber(cfg?.customerRent, 0),
      customerShipping: toNumber(cfg?.customerShipping, 0),
      vendorRent: toNumber(cfg?.vendorRent, 0),
      vendorShipping: toNumber(cfg?.vendorShipping, 0),
    };
  });

/** Vendor-style flat variants (legacy) */
const normalizeVariantsLegacy = (variantsRaw) => {
  const arr = Array.isArray(variantsRaw) ? variantsRaw : [];
  return arr.map((v) => ({
    variantName: String(v?.variantName || '').trim(),
    images: Array.isArray(v?.images) ? v.images.filter(Boolean) : [],
    variantSpecs: normalizeLabelValueRows(v?.variantSpecs),
    rentalConfigurations: normalizeRentalTiers(v?.rentalConfigurations),
    refundableDeposit: toNumber(v?.refundableDeposit, 0),
    price: String(v?.price || '').trim(),
    stock: toNumber(v?.stock, 0),
    color: String(v?.color || '').trim(),
    storage: String(v?.storage || '').trim(),
    ram: String(v?.ram || '').trim(),
    condition: String(v?.condition || '').trim(),
  }));
};

const normalizeVariantsFlexible = (variantsRaw) => {
  const arr = Array.isArray(variantsRaw) ? variantsRaw : [];
  return arr.map((v) => ({
    variantName: String(v?.variantName || '').trim(),
    existingVariantImages: Array.isArray(v?.existingVariantImages)
      ? v.existingVariantImages.filter(Boolean)
      : [],
    variantSpecs: normalizeLabelValueRows(v?.variantSpecs),
    rentalPricingModel: v?.rentalPricingModel === 'day' ? 'day' : 'month',
    allowVendorEditRentalPrices:
      v?.allowVendorEditRentalPrices === false ||
      v?.allowVendorEditRentalPrices === 'false'
        ? false
        : true,
    rentalConfigurations: normalizeRentalTiers(v?.rentalConfigurations),
    refundableDeposit: toNumber(v?.refundableDeposit, 0),
    price: String(v?.price || '').trim(),
    stock: toNumber(v?.stock, 0),
    color: String(v?.color || '').trim(),
    storage: String(v?.storage || '').trim(),
    ram: String(v?.ram || '').trim(),
    condition: String(v?.condition || '').trim(),
  }));
};

function splitListingTemplateFiles(files) {
  const main = [];
  const byVariant = {};
  for (const f of files || []) {
    if (f.fieldname === 'images') {
      if (main.length < 10) main.push(f);
      continue;
    }
    const m = /^variantImages_(\d+)$/.exec(f.fieldname);
    if (m) {
      const idx = Number(m[1]);
      if (!byVariant[idx]) byVariant[idx] = [];
      if (byVariant[idx].length < 10) byVariant[idx].push(f);
    }
  }
  return { mainFiles: main, variantFilesByIndex: byVariant };
}

async function uploadMany(files, folder) {
  const urls = [];
  for (const file of files || []) {
    const imgRes = await uploadImageToCloudinary(file.buffer, folder);
    urls.push(imgRes.secure_url);
  }
  return urls;
}

async function mergeVariantImages(variant, files) {
  const uploaded = await uploadMany(files, 'listing-templates/variants');
  const kept = Array.isArray(variant.existingVariantImages)
    ? variant.existingVariantImages.filter(Boolean)
    : [];
  const merged = [...kept, ...uploaded].slice(0, 10);
  delete variant.existingVariantImages;
  variant.images = merged;
}

const normalizePayload = (body, { flexibleVariants } = {}) => {
  const data = { ...body };
  data.sku = String(body.sku || '').trim();
  const t = String(body.type || 'Rental');
  data.type = t === 'Sell' ? 'Sell' : 'Rental';
  if (
    body.isActive !== undefined &&
    body.isActive !== null &&
    body.isActive !== ''
  ) {
    data.isActive =
      body.isActive === true ||
      body.isActive === 'true' ||
      body.isActive === '1';
  }

  data.productCustomSpecs = normalizeLabelValueRows(
    parseJsonField(body.productCustomSpecs, []),
  );
  data.specifications = parseJsonField(body.specifications, {});

  const variantsParsed = parseJsonField(body.variants, []);
  data.variants = flexibleVariants
    ? normalizeVariantsFlexible(variantsParsed)
    : normalizeVariantsLegacy(variantsParsed);

  data.rentalConfigurations = normalizeRentalTiers(
    parseJsonField(body.rentalConfigurations, []),
  );
  data.refundableDeposit = toNumber(body.refundableDeposit, 0);
  data.logisticsVerification = parseJsonField(body.logisticsVerification, {});
  data.existingImages = parseJsonField(body.existingImages, []);
  data.stock = toNumber(body.stock, 0);
  delete data.flexibleVariants;
  return data;
};

function resolveTemplateImage(data) {
  if (data.images?.length) {
    return data.images[0];
  }
  for (const v of data.variants || []) {
    if (v.images?.length) return v.images[0];
  }
  return '';
}

export const listListingTemplates = async (req, res) => {
  try {
    const listingTemplates = await ListingTemplate.find().sort({
      updatedAt: -1,
    });
    res.json({ listingTemplates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getListingTemplate = async (req, res) => {
  try {
    const doc = await ListingTemplate.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Listing template not found' });
    }
    res.json({ listingTemplate: doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createListingTemplate = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length > MAX_UPLOAD_FILES) {
      return res.status(400).json({ message: 'Too many files uploaded' });
    }

    const flexibleVariants =
      req.body.flexibleVariants === 'true' ||
      req.body.flexibleVariants === true;

    const { mainFiles, variantFilesByIndex } = splitListingTemplateFiles(files);
    const data = normalizePayload(req.body, { flexibleVariants });

    const mainUploaded = await uploadMany(mainFiles, 'listing-templates');
    if (mainUploaded.length > 0) {
      data.images = mainUploaded.slice(0, 10);
    } else if (Array.isArray(data.existingImages) && data.existingImages.length) {
      data.images = data.existingImages.filter(Boolean).slice(0, 10);
    } else {
      data.images = [];
    }

    for (let i = 0; i < data.variants.length; i++) {
      await mergeVariantImages(
        data.variants[i],
        variantFilesByIndex[i] || [],
      );
    }

    data.image = resolveTemplateImage(data);
    if (!data.image) {
      return res.status(400).json({
        message:
          'Add at least one image on the listing or on a variant',
      });
    }

    delete data.existingImages;
    delete data.flexibleVariants;

    const listingTemplate = await ListingTemplate.create(data);

    res.status(201).json({
      message: 'Listing template created',
      listingTemplate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateListingTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files || [];
    if (files.length > MAX_UPLOAD_FILES) {
      return res.status(400).json({ message: 'Too many files uploaded' });
    }

    const flexibleVariants =
      req.body.flexibleVariants === 'true' ||
      req.body.flexibleVariants === true;

    const existing = await ListingTemplate.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Listing template not found' });
    }

    const { mainFiles, variantFilesByIndex } = splitListingTemplateFiles(files);
    const data = normalizePayload(req.body, { flexibleVariants });

    const mainUploaded = await uploadMany(mainFiles, 'listing-templates');
    const keptExistingImages = Array.isArray(data.existingImages)
      ? data.existingImages.filter(Boolean)
      : Array.isArray(existing.images)
        ? existing.images
        : existing.image
          ? [existing.image]
          : [];
    data.images = [...keptExistingImages, ...mainUploaded].slice(0, 10);

    for (let i = 0; i < data.variants.length; i++) {
      const incoming = data.variants[i];
      const prev = existing.variants?.[i];
      const hasIncoming =
        (incoming.existingVariantImages &&
          incoming.existingVariantImages.length > 0) ||
        (variantFilesByIndex[i] && variantFilesByIndex[i].length > 0);
      if (!hasIncoming && prev?.images?.length) {
        incoming.existingVariantImages = [...prev.images];
      }
    }

    for (let i = 0; i < data.variants.length; i++) {
      await mergeVariantImages(
        data.variants[i],
        variantFilesByIndex[i] || [],
      );
    }

    data.image = resolveTemplateImage(data);
    if (!data.image) {
      return res.status(400).json({
        message:
          'At least one image is required (listing or variant)',
      });
    }

    delete data.existingImages;
    delete data.flexibleVariants;

    const listingTemplate = await ListingTemplate.findByIdAndUpdate(id, data, {
      new: true,
    });

    res.json({
      message: 'Listing template updated',
      listingTemplate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteListingTemplate = async (req, res) => {
  try {
    const doc = await ListingTemplate.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Listing template not found' });
    }
    res.json({ message: 'Listing template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const patchListingTemplateActive = async (req, res) => {
  try {
    const { id } = req.params;
    const isActive =
      req.body.isActive === true ||
      req.body.isActive === 'true' ||
      req.body.isActive === '1';
    const listingTemplate = await ListingTemplate.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );
    if (!listingTemplate) {
      return res.status(404).json({ message: 'Listing template not found' });
    }
    res.json({ listingTemplate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
