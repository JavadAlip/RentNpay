import SellListingTemplate from '../../models/SellListingTemplate.js';
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

const normalizeVariants = (variantsRaw) => {
  const arr = Array.isArray(variantsRaw) ? variantsRaw : [];
  return arr.map((v) => ({
    variantName: String(v?.variantName || '').trim(),
    existingVariantImages: Array.isArray(v?.existingVariantImages)
      ? v.existingVariantImages.filter(Boolean)
      : [],
    variantSpecs: normalizeLabelValueRows(v?.variantSpecs),
    price: String(v?.price || '').trim(),
    stock: toNumber(v?.stock, 0),
    color: String(v?.color || '').trim(),
    storage: String(v?.storage || '').trim(),
    ram: String(v?.ram || '').trim(),
    condition: String(v?.condition || '').trim(),
  }));
};

function splitFiles(files) {
  const main = [];
  const byVariant = {};
  for (const f of files || []) {
    if (f.fieldname === 'images') {
      if (main.length < 5) main.push(f);
      continue;
    }
    const m = /^variantImages_(\d+)$/.exec(f.fieldname);
    if (!m) continue;
    const idx = Number(m[1]);
    if (!byVariant[idx]) byVariant[idx] = [];
    if (byVariant[idx].length < 5) byVariant[idx].push(f);
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
  const uploaded = await uploadMany(files, 'sell-listing-templates/variants');
  const kept = Array.isArray(variant.existingVariantImages)
    ? variant.existingVariantImages.filter(Boolean)
    : [];
  variant.images = [...kept, ...uploaded].slice(0, 5);
  delete variant.existingVariantImages;
}

const normalizePayload = (body) => {
  const data = { ...body };
  data.type = 'Sell';
  data.sku = String(body.sku || '').trim();
  data.isActive =
    body.isActive === undefined
      ? true
      : body.isActive === true ||
        body.isActive === 'true' ||
        body.isActive === '1';
  data.productCustomSpecs = normalizeLabelValueRows(
    parseJsonField(body.productCustomSpecs, []),
  );
  data.specifications = parseJsonField(body.specifications, {});
  data.variants = normalizeVariants(parseJsonField(body.variants, []));
  data.existingImages = parseJsonField(body.existingImages, []);
  data.stock = toNumber(body.stock, 0);
  data.salesConfiguration = (() => {
    const s = parseJsonField(body.salesConfiguration, {});
    return {
      allowVendorEditSalePrice:
        s.allowVendorEditSalePrice === false ||
        s.allowVendorEditSalePrice === 'false'
          ? false
          : true,
      salePrice: toNumber(s.salePrice, toNumber(body.price, 0)),
      mrpPrice: toNumber(s.mrpPrice, 0),
    };
  })();
  return data;
};

const resolveImage = (data) => {
  if (Array.isArray(data.images) && data.images.length) return data.images[0];
  for (const v of data.variants || []) {
    if (Array.isArray(v.images) && v.images.length) return v.images[0];
  }
  return '';
};

export const listSellListingTemplates = async (req, res) => {
  try {
    const docs = await SellListingTemplate.find().sort({ updatedAt: -1 });
    res.json({ sellListingTemplates: docs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSellListingTemplate = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length > MAX_UPLOAD_FILES) {
      return res.status(400).json({ message: 'Too many files uploaded' });
    }
    const { mainFiles, variantFilesByIndex } = splitFiles(files);
    const data = normalizePayload(req.body);

    const mainUploaded = await uploadMany(mainFiles, 'sell-listing-templates');
    data.images =
      mainUploaded.length > 0
        ? mainUploaded.slice(0, 5)
        : Array.isArray(data.existingImages)
          ? data.existingImages.filter(Boolean).slice(0, 5)
          : [];

    for (let i = 0; i < data.variants.length; i++) {
      await mergeVariantImages(data.variants[i], variantFilesByIndex[i] || []);
    }

    data.image = resolveImage(data);
    if (!data.image) {
      return res
        .status(400)
        .json({ message: 'Add at least one image on product or variant' });
    }
    delete data.existingImages;

    const sellListingTemplate = await SellListingTemplate.create(data);
    res.status(201).json({ sellListingTemplate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSellListingTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await SellListingTemplate.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Sell listing template not found' });
    }

    const files = req.files || [];
    const { mainFiles, variantFilesByIndex } = splitFiles(files);
    const data = normalizePayload(req.body);
    const mainUploaded = await uploadMany(mainFiles, 'sell-listing-templates');

    const keptExistingImages = Array.isArray(data.existingImages)
      ? data.existingImages.filter(Boolean)
      : Array.isArray(existing.images)
        ? existing.images
        : [];
    data.images = [...keptExistingImages, ...mainUploaded].slice(0, 5);

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
      await mergeVariantImages(incoming, variantFilesByIndex[i] || []);
    }

    data.image = resolveImage(data);
    if (!data.image) {
      return res
        .status(400)
        .json({ message: 'At least one image is required for sell listing' });
    }
    delete data.existingImages;

    const sellListingTemplate = await SellListingTemplate.findByIdAndUpdate(
      id,
      data,
      { new: true },
    );
    res.json({ sellListingTemplate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSellListingTemplate = async (req, res) => {
  try {
    const doc = await SellListingTemplate.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Sell listing template not found' });
    }
    res.json({ message: 'Sell listing template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const patchSellListingTemplateActive = async (req, res) => {
  try {
    const { id } = req.params;
    const isActive =
      req.body.isActive === true ||
      req.body.isActive === 'true' ||
      req.body.isActive === '1';
    const sellListingTemplate = await SellListingTemplate.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );
    if (!sellListingTemplate) {
      return res.status(404).json({ message: 'Sell listing template not found' });
    }
    res.json({ sellListingTemplate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
