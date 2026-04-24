'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Box,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Key,
  Package,
  Save,
  Search,
  Tag,
  Upload,
} from 'lucide-react';
import {
  getCategories,
  getSubCategories,
} from '../../../redux/slices/categorySlice';

/** Prefer icon URL, then image, for category / subcategory picker cards. */
function categoryOrSubAssetUrl(item) {
  const icon = String(item?.icon || '').trim();
  if (icon) return icon;
  const img = String(item?.image || '').trim();
  return img || '';
}

/** `public/rent-out.png` — Key fallback matches vendor modal sizing. */
function RentOutListingIcon({ className }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <Key
        className="h-6 w-6 shrink-0 text-gray-500"
        strokeWidth={2}
        aria-hidden
      />
    );
  }
  return (
    <img
      src="/rent-out.png"
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

const SPEC_FIELDS_BY_CATEGORY = {
  furniture: [
    { key: 'material', label: 'Material' },
    { key: 'dimensions', label: 'Dimensions' },
    { key: 'weightCapacity', label: 'Weight Capacity' },
    { key: 'upholsteryType', label: 'Upholstery Type' },
    { key: 'assemblyRequired', label: 'Assembly Required' },
    { key: 'finishType', label: 'Finish Type' },
    { key: 'colorFamily', label: 'Color Family' },
    { key: 'warranty', label: 'Warranty' },
  ],
  electronics: [
    { key: 'display', label: 'Display' },
    { key: 'processor', label: 'Processor' },
    { key: 'ram', label: 'RAM' },
    { key: 'storage', label: 'Storage' },
    { key: 'battery', label: 'Battery' },
    { key: 'camera', label: 'Camera' },
    { key: 'connectivity', label: 'Connectivity' },
    { key: 'warranty', label: 'Warranty' },
  ],
  vehicle: [
    { key: 'engineCapacity', label: 'Engine Capacity' },
    { key: 'fuelType', label: 'Fuel Type' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'seatingCapacity', label: 'Seating Capacity' },
    { key: 'mileage', label: 'Mileage' },
    { key: 'insuranceValidity', label: 'Insurance Validity' },
    { key: 'registrationYear', label: 'Registration Year' },
    { key: 'warranty', label: 'Warranty' },
  ],
};

const defaultRentalConfigs = () => [
  { months: 3, label: 'Most Popular', pricePerDay: '' },
  { months: 6, label: '', pricePerDay: '' },
  { months: 12, label: '', pricePerDay: '' },
];

const TIER_PRESETS_MONTH = [
  { months: 3, tierLabel: 'SHORT TERM', label: '3 Months' },
  { months: 6, tierLabel: 'STANDARD', label: '6 Months' },
  { months: 12, tierLabel: 'LONG TERM', label: '12 Months' },
];

const TIER_PRESETS_DAY = [
  { days: 3, tierLabel: 'SHORT TERM', label: '3 Days' },
  { days: 5, tierLabel: 'STANDARD', label: '5 Days' },
  { days: 7, tierLabel: 'LONG TERM', label: '7 Days' },
];

const emptyRentalTier = (preset, periodUnit) => ({
  months: periodUnit === 'month' ? preset.months || 0 : 0,
  days: periodUnit === 'day' ? preset.days || 0 : 0,
  periodUnit,
  tierLabel: preset.tierLabel || '',
  label: preset.label || '',
  pricePerDay: '',
  customerRent: '',
  customerShipping: '',
  vendorRent: '',
  vendorShipping: '',
});

const defaultRentalTermsMonth = () =>
  TIER_PRESETS_MONTH.map((p) => emptyRentalTier(p, 'month'));

const defaultRentalTermsDay = () =>
  TIER_PRESETS_DAY.map((p) => emptyRentalTier(p, 'day'));

// Deterministic key generator to avoid SSR/CSR hydration mismatches.
// (We intentionally do NOT use randomUUID/Date.now here.)
let _variantKeySeq = 0;
function newVariantClientKey() {
  _variantKeySeq += 1;
  return `vk-${_variantKeySeq}`;
}

const emptyFlexibleVariant = () => ({
  _clientKey: newVariantClientKey(),
  variantName: '',
  price: '',
  stock: '',
  images: [],
  existingVariantImages: [],
  specRows: [{ label: '', value: '' }],
  rentalPricingModel: 'month',
  allowVendorEditRentalPrices: true,
  rentalConfigurations: defaultRentalTermsMonth(),
  refundableDeposit: '',
});

const legacyEmptyVariant = () => ({
  _clientKey: newVariantClientKey(),
  variantName: '',
  color: '',
  storage: '',
  ram: '',
  condition: '',
  price: '',
  stock: '',
});

function specsObjectToRows(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return [{ label: '', value: '' }];
  }
  const entries = Object.entries(obj).filter(
    ([, v]) => v != null && String(v).trim() !== '',
  );
  return entries.length
    ? entries.map(([label, value]) => ({ label, value: String(value) }))
    : [{ label: '', value: '' }];
}

function numOr(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const SELL_CONDITION_OPTIONS = ['Brand New', 'Refurbished'];
/** Admin rental listings: same two options as sell (no Like New / Good / Fair). */
const RENTAL_CONDITION_OPTIONS = ['Brand New', 'Refurbished'];

/** Keep condition valid for listing type. */
function normalizeConditionForListingType(condition, listingType) {
  const c = String(condition || '').trim();
  if (listingType === 'Sell') {
    return SELL_CONDITION_OPTIONS.includes(c) ? c : 'Brand New';
  }
  if (RENTAL_CONDITION_OPTIONS.includes(c)) return c;
  if (c === 'Like New') return 'Brand New';
  if (c === 'Good' || c === 'Fair') return 'Refurbished';
  return 'Brand New';
}

function mapFlexibleRentalTierFromApi(cfg, index) {
  const periodUnit = cfg.periodUnit === 'day' ? 'day' : 'month';
  const months = numOr(cfg.months, 0);
  const days = numOr(cfg.days, 0);
  const m =
    periodUnit === 'month'
      ? months || TIER_PRESETS_MONTH[index]?.months || 3
      : 0;
  const d =
    periodUnit === 'day' ? days || TIER_PRESETS_DAY[index]?.days || 3 : 0;
  const hasExtended =
    cfg.tierLabel ||
    cfg.customerRent != null ||
    cfg.vendorRent != null ||
    cfg.customerShipping != null ||
    cfg.vendorShipping != null;

  const tierLabel =
    String(cfg.tierLabel || '').trim() ||
    (hasExtended ? '' : String(cfg.label || '').trim()) ||
    TIER_PRESETS_MONTH[index]?.tierLabel ||
    TIER_PRESETS_DAY[index]?.tierLabel ||
    '';

  const label =
    String(cfg.label || '').trim() ||
    (periodUnit === 'month' ? `${m} Months` : `${d} Days`);

  const strVal = (x) =>
    x === undefined || x === null || x === '' ? '' : String(x);

  return {
    months: periodUnit === 'month' ? m : 0,
    days: periodUnit === 'day' ? d : 0,
    periodUnit,
    tierLabel,
    label,
    pricePerDay: strVal(cfg.pricePerDay),
    customerRent: strVal(cfg.customerRent),
    customerShipping: strVal(cfg.customerShipping),
    vendorRent: strVal(cfg.vendorRent),
    vendorShipping: strVal(cfg.vendorShipping),
  };
}

function mapVariantFromApi(v) {
  const rentalPricingModel = v.rentalPricingModel === 'day' ? 'day' : 'month';
  const allowVendorEditRentalPrices = v.allowVendorEditRentalPrices !== false;

  let rental;
  if (Array.isArray(v.rentalConfigurations) && v.rentalConfigurations.length) {
    rental = v.rentalConfigurations.map((cfg, i) =>
      mapFlexibleRentalTierFromApi(
        { ...cfg, periodUnit: rentalPricingModel },
        i,
      ),
    );
  } else {
    rental =
      rentalPricingModel === 'day'
        ? defaultRentalTermsDay()
        : defaultRentalTermsMonth();
  }

  let specRows = [{ label: '', value: '' }];
  if (Array.isArray(v.variantSpecs) && v.variantSpecs.length) {
    specRows = v.variantSpecs.map((r) => ({
      label: r.label || '',
      value: r.value || '',
    }));
  } else if (v.color || v.storage || v.ram) {
    const rows = [
      ...(v.color ? [{ label: 'Color', value: v.color }] : []),
      ...(v.storage ? [{ label: 'Storage', value: v.storage }] : []),
      ...(v.ram ? [{ label: 'RAM', value: v.ram }] : []),
    ];
    specRows = rows.length ? rows : [{ label: '', value: '' }];
  }

  return {
    _clientKey: v._clientKey || newVariantClientKey(),
    variantName: v.variantName || '',
    price: v.price || '',
    stock: v.stock === undefined || v.stock === null ? '' : String(v.stock),
    images: [],
    existingVariantImages: Array.isArray(v.images)
      ? v.images.filter(Boolean).slice(0, 10)
      : [],
    specRows,
    rentalPricingModel,
    allowVendorEditRentalPrices,
    rentalConfigurations: rental,
    refundableDeposit:
      v.refundableDeposit === undefined || v.refundableDeposit === null
        ? ''
        : String(v.refundableDeposit),
  };
}

function standardProductThumbUrl(p) {
  return (
    p?.images?.[0] ||
    p?.image ||
    'https://placehold.co/56x56/e5e7eb/6b7280?text=IMG'
  );
}

function rentalConfigsFromStandardProduct(product) {
  const raw =
    Array.isArray(product?.rentalConfigurations) &&
    product.rentalConfigurations.length
      ? product.rentalConfigurations
      : product?.variants?.[0]?.rentalConfigurations;
  if (!Array.isArray(raw) || !raw.length) return defaultRentalTermsMonth();
  return raw.map((cfg, i) =>
    mapFlexibleRentalTierFromApi({ ...cfg, periodUnit: 'month' }, i),
  );
}

function existingImagesFromStandardProduct(product) {
  if (Array.isArray(product?.images) && product.images.length) {
    return product.images.filter(Boolean).slice(0, 10);
  }
  if (product?.image) return [product.image];
  return [];
}

function standardProductPriceLabel(p) {
  const pickThreeMo = (configs) => {
    if (!Array.isArray(configs)) return null;
    return configs.find((c) => Number(c.months) === 3) ?? null;
  };
  let tier = pickThreeMo(p?.rentalConfigurations);
  if (!tier && Array.isArray(p?.variants)) {
    for (const v of p.variants) {
      tier = pickThreeMo(v?.rentalConfigurations);
      if (tier) break;
    }
  }
  if (
    tier != null &&
    tier.pricePerDay != null &&
    String(tier.pricePerDay).trim() !== ''
  ) {
    const perDay = Number(tier.pricePerDay);
    if (!Number.isNaN(perDay)) {
      const approxMonth = Math.round(perDay * 30);
      return `₹${approxMonth}/month`;
    }
  }
  const raw = p?.price;
  if (raw != null && String(raw).trim() !== '') {
    const s = String(raw).trim();
    if (/month|\/mo/i.test(s) || /[₹]|rs\.?/i.test(s)) return s;
    return `₹${s}/month`;
  }
  return '—';
}

/** Subline under product name in standard catalog table (matches Custom Listings table). */
function standardCatalogProductSubprice(p) {
  const pickThreeMo = (configs) => {
    if (!Array.isArray(configs)) return null;
    return configs.find((c) => Number(c.months) === 3) ?? null;
  };
  let tier = pickThreeMo(p?.rentalConfigurations);
  if (!tier && Array.isArray(p?.variants)) {
    for (const v of p.variants) {
      tier = pickThreeMo(v?.rentalConfigurations);
      if (tier) break;
    }
  }
  if (
    tier != null &&
    tier.pricePerDay != null &&
    String(tier.pricePerDay).trim() !== ''
  ) {
    return `3 mo • ${tier.pricePerDay}/day`;
  }
  if (p?.price != null && String(p.price).trim() !== '') return String(p.price);
  return '—';
}

function VariantNewImagePreview({ file }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url ? (
    <img
      src={url}
      alt=""
      className="h-16 w-16 rounded-lg object-cover border"
    />
  ) : null;
}

function VariantRowNewThumb({ file }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) return undefined;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!url) {
    return (
      <div className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 bg-gray-100" />
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 object-cover bg-white"
    />
  );
}

function VariantListThumbnail({ variant }) {
  const existing = (variant.existingVariantImages || [])[0];
  const firstNew = (variant.images || [])[0];
  if (existing) {
    return (
      <img
        src={existing}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 bg-white object-cover"
      />
    );
  }
  if (firstNew) {
    return <VariantRowNewThumb file={firstNew} />;
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs font-medium text-gray-400">
      —
    </div>
  );
}

/** One-line price for variant summary row (flexible listing). */
function flexibleVariantPriceLine(variant, listingType) {
  if (listingType === 'Sell') {
    const p = variant?.price;
    if (p != null && String(p).trim() !== '') return `₹${p}`;
    return '—';
  }
  const cfgs = variant?.rentalConfigurations || [];
  const first = cfgs[0];
  if (!first) return '—';
  const rent = first.customerRent;
  if (rent == null || String(rent).trim() === '') return '—';
  const suffix = variant?.rentalPricingModel === 'day' ? 'day' : 'month';
  return `₹${rent}/${suffix}`;
}

/** Strip File blobs so draft JSON can be stored in localStorage. */
function serializeFormForDraft(form) {
  const productStringUrls = (form.images || []).filter(
    (x) => typeof x === 'string' && String(x).trim(),
  );
  const productExisting = (form.existingImages || []).filter(Boolean);
  const mergedProductImages = [...productExisting, ...productStringUrls].slice(
    0,
    5,
  );
  return {
    ...form,
    images: [],
    existingImages: mergedProductImages,
    variants: (form.variants || []).map((v) => {
      const filePicks = (v.images || []).filter((x) => x instanceof File);
      const stringUrlsFromImages = (v.images || []).filter(
        (x) => typeof x === 'string' && String(x).trim(),
      );
      const existing = (v.existingVariantImages || []).filter(Boolean);
      const mergedUrls = [...existing, ...stringUrlsFromImages].slice(0, 10);
      const { images: _ignored, ...rest } = v;
      void filePicks;
      return {
        ...rest,
        images: [],
        existingVariantImages: mergedUrls,
      };
    }),
  };
}

function buildDraftPayload(form, mode, initialData) {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    mode,
    editingId: initialData?._id || initialData?.id || null,
    form: serializeFormForDraft(form),
  };
}

const defaultForm = {
  sku: '',
  productName: '',
  type: 'Rental',
  category: '',
  subCategory: '',
  brand: '',
  condition: 'Brand New',
  shortDescription: '',
  description: '',
  specifications: {},
  productCustomSpecs: [{ label: '', value: '' }],
  variants: [
    {
      _clientKey: newVariantClientKey(),
      variantName: '',
      color: '',
      storage: '',
      ram: '',
      condition: '',
      price: '',
      stock: '',
    },
  ],
  rentalConfigurations: [
    { months: 3, label: 'Most Popular', pricePerDay: '' },
    { months: 6, label: '', pricePerDay: '' },
    { months: 12, label: '', pricePerDay: '' },
  ],
  refundableDeposit: '',
  logisticsVerification: {
    inventoryOwnerName: '',
    city: '',
  },
  price: '',
  stock: '',
  status: 'Active',
  isActive: true,
  images: [],
  existingImages: [],
  salesConfiguration: {
    allowVendorEditSalePrice: true,
    salePrice: '',
    mrpPrice: '',
  },
};

function strDraftVal(x) {
  if (x === undefined || x === null) return '';
  return String(x);
}

function normalizeVariantFromDraftSnapshot(v) {
  const rentalPricingModel = v.rentalPricingModel === 'day' ? 'day' : 'month';
  const rentalConfigurations =
    Array.isArray(v.rentalConfigurations) && v.rentalConfigurations.length
      ? v.rentalConfigurations.map((cfg) => ({
          months:
            cfg.months !== undefined && cfg.months !== null
              ? Number(cfg.months) || 0
              : 0,
          days:
            cfg.days !== undefined && cfg.days !== null
              ? Number(cfg.days) || 0
              : 0,
          periodUnit: cfg.periodUnit === 'day' ? 'day' : 'month',
          tierLabel: strDraftVal(cfg.tierLabel),
          label: strDraftVal(cfg.label),
          pricePerDay: strDraftVal(cfg.pricePerDay),
          customerRent: strDraftVal(cfg.customerRent),
          customerShipping: strDraftVal(cfg.customerShipping),
          vendorRent: strDraftVal(cfg.vendorRent),
          vendorShipping: strDraftVal(cfg.vendorShipping),
        }))
      : rentalPricingModel === 'day'
        ? defaultRentalTermsDay()
        : defaultRentalTermsMonth();

  return {
    _clientKey: v._clientKey || newVariantClientKey(),
    variantName: v.variantName || '',
    price: strDraftVal(v.price),
    stock:
      v.stock === undefined || v.stock === null ? '' : strDraftVal(v.stock),
    images: [],
    existingVariantImages: (() => {
      const ex = Array.isArray(v.existingVariantImages)
        ? v.existingVariantImages.filter(Boolean)
        : [];
      if (ex.length) return ex.slice(0, 10);
      const legacy = Array.isArray(v.images)
        ? v.images.filter((u) => typeof u === 'string' && u.trim())
        : [];
      return legacy.slice(0, 10);
    })(),
    specRows:
      Array.isArray(v.specRows) && v.specRows.length
        ? v.specRows.map((r) => ({
            label: strDraftVal(r.label),
            value: strDraftVal(r.value),
          }))
        : [{ label: '', value: '' }],
    rentalPricingModel,
    allowVendorEditRentalPrices: v.allowVendorEditRentalPrices !== false,
    rentalConfigurations,
    refundableDeposit:
      v.refundableDeposit === undefined || v.refundableDeposit === null
        ? ''
        : strDraftVal(v.refundableDeposit),
  };
}

/** Rebuild flexible listing `form` state from a localStorage draft blob. */
function flexibleListingFormFromSerializedDraft(f) {
  if (!f || typeof f !== 'object') return null;
  const variantsRaw = f.variants;
  const variants =
    Array.isArray(variantsRaw) && variantsRaw.length
      ? variantsRaw.map(normalizeVariantFromDraftSnapshot)
      : [emptyFlexibleVariant()];

  const productCustomSpecs =
    Array.isArray(f.productCustomSpecs) && f.productCustomSpecs.length
      ? f.productCustomSpecs.map((r) => ({
          label: strDraftVal(r.label),
          value: strDraftVal(r.value),
        }))
      : [{ label: '', value: '' }];

  const initType = f.type === 'Sell' ? 'Sell' : 'Rental';
  return {
    ...defaultForm,
    sku: strDraftVal(f.sku),
    productName: f.productName || '',
    type: initType,
    category: strDraftVal(f.category).trim(),
    subCategory: strDraftVal(f.subCategory).trim(),
    brand: strDraftVal(f.brand),
    condition: normalizeConditionForListingType(f.condition, initType),
    shortDescription: strDraftVal(f.shortDescription),
    description: strDraftVal(f.description),
    specifications:
      f.specifications && typeof f.specifications === 'object'
        ? f.specifications
        : {},
    productCustomSpecs,
    variants,
    rentalConfigurations: [...defaultForm.rentalConfigurations],
    refundableDeposit: strDraftVal(f.refundableDeposit),
    logisticsVerification: {
      inventoryOwnerName: strDraftVal(
        f.logisticsVerification?.inventoryOwnerName,
      ),
      city: strDraftVal(f.logisticsVerification?.city),
    },
    price: strDraftVal(f.price),
    stock:
      f.stock === undefined || f.stock === null ? '' : strDraftVal(f.stock),
    status: f.status || 'Active',
    isActive: f.isActive !== false,
    images: [],
    existingImages: (() => {
      const ex = Array.isArray(f.existingImages)
        ? f.existingImages.filter(Boolean)
        : [];
      if (ex.length) return ex.slice(0, 10);
      const legacy = Array.isArray(f.images)
        ? f.images.filter((u) => typeof u === 'string' && u.trim())
        : [];
      return legacy.slice(0, 10);
    })(),
    salesConfiguration: {
      allowVendorEditSalePrice:
        f.salesConfiguration?.allowVendorEditSalePrice !== false,
      salePrice:
        f.salesConfiguration?.salePrice === undefined ||
        f.salesConfiguration?.salePrice === null
          ? ''
          : strDraftVal(f.salesConfiguration.salePrice),
      mrpPrice:
        f.salesConfiguration?.mrpPrice === undefined ||
        f.salesConfiguration?.mrpPrice === null
          ? ''
          : strDraftVal(f.salesConfiguration.mrpPrice),
    },
  };
}

/** Map admin ListingTemplate → vendor legacy form (non–flexible listing). */
function buildVendorFormStateFromListingTemplate(template) {
  if (!template || typeof template !== 'object') {
    return { ...defaultForm, variants: [{ ...legacyEmptyVariant() }] };
  }

  let specifications =
    template.specifications &&
    typeof template.specifications === 'object' &&
    !Array.isArray(template.specifications)
      ? { ...template.specifications }
      : {};
  if (
    Object.keys(specifications).length === 0 &&
    Array.isArray(template.productCustomSpecs)
  ) {
    for (const row of template.productCustomSpecs) {
      const k = String(row?.label || '').trim();
      if (k) specifications[k] = String(row?.value ?? '');
    }
  }

  const rentalSource =
    Array.isArray(template.rentalConfigurations) &&
    template.rentalConfigurations.length
      ? template.rentalConfigurations
      : template.variants?.[0]?.rentalConfigurations;

  let rentalConfigurations = defaultForm.rentalConfigurations.map((s) => ({
    ...s,
  }));
  if (Array.isArray(rentalSource) && rentalSource.length) {
    rentalSource.slice(0, 3).forEach((cfg, i) => {
      if (!rentalConfigurations[i]) return;
      const periodUnit = cfg.periodUnit === 'day' ? 'day' : 'month';
      const slotMonths = rentalConfigurations[i].months;
      const months =
        periodUnit === 'month' ? numOr(cfg.months, slotMonths) : slotMonths;
      const label =
        String(cfg.label || '').trim() ||
        rentalConfigurations[i].label ||
        (periodUnit === 'day'
          ? `${numOr(cfg.days, 7)} Days`
          : `${months} Months`);
      rentalConfigurations[i] = {
        months,
        label,
        pricePerDay:
          cfg.pricePerDay === undefined || cfg.pricePerDay === null
            ? ''
            : String(cfg.pricePerDay),
      };
    });
  }

  const tplType = template.type || 'Rental';

  const variantsFromTemplate =
    Array.isArray(template.variants) && template.variants.length
      ? template.variants.map((v) => ({
          _clientKey: newVariantClientKey(),
          variantName: v.variantName || '',
          color: v.color || '',
          storage: v.storage || '',
          ram: v.ram || '',
          condition: normalizeConditionForListingType(
            v.condition || template.condition,
            tplType,
          ),
          price: v.price || template.price || '',
          stock:
            v.stock === undefined || v.stock === null
              ? template.stock !== undefined && template.stock !== null
                ? String(template.stock)
                : ''
              : String(v.stock),
        }))
      : [
          {
            ...legacyEmptyVariant(),
            variantName: template.productName || '',
            condition: normalizeConditionForListingType(
              template.condition,
              tplType,
            ),
            price: template.price || '',
            stock:
              template.stock === undefined || template.stock === null
                ? ''
                : String(template.stock),
          },
        ];

  return {
    sku: template.sku || '',
    productName: template.productName || '',
    type: tplType,
    category: template.category || '',
    subCategory: template.subCategory || '',
    brand: template.brand || '',
    condition: normalizeConditionForListingType(template.condition, tplType),
    shortDescription: template.shortDescription || '',
    description: template.description || '',
    specifications,
    productCustomSpecs: [{ label: '', value: '' }],
    variants: variantsFromTemplate,
    rentalConfigurations,
    refundableDeposit:
      template.refundableDeposit === undefined ||
      template.refundableDeposit === null
        ? ''
        : String(template.refundableDeposit),
    logisticsVerification: {
      inventoryOwnerName:
        template.logisticsVerification?.inventoryOwnerName || '',
      city: template.logisticsVerification?.city || '',
    },
    price: template.price || '',
    stock:
      template.stock === undefined || template.stock === null
        ? ''
        : String(template.stock),
    status: template.status || 'Active',
    isActive: template.isActive !== false,
    images: [],
    existingImages: (() => {
      const top = existingImagesFromStandardProduct(template);
      if (top.length) return top;
      const v0 = template?.variants?.[0];
      if (Array.isArray(v0?.images) && v0.images.length) {
        return v0.images.filter(Boolean).slice(0, 10);
      }
      return [];
    })(),
  };
}

const AdminProductAddModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialData = null,
  existingProducts = [],
  enableStandardProductSearch = true,
  standardCatalogLoading = false,
  /** When true: show admin catalog as a read-only table (Custom Listings style), no Add. */
  standardCatalogTableOnly = false,
  /** Vendor flow: Add loads full template into the form (not just a new variant row). */
  standardCatalogPopulateFullForm = false,
  /** Optional: fetch fresh template by id (recommended). If omitted, list row data is used. */
  fetchStandardListingTemplate = null,
  standardSearchPlaceholder = 'Search your Listed Products',
  standardCatalogShowCustomListingButton = false,
  modalTitleCreate = 'Add New Listing',
  modalTitleEdit = 'Edit Listing',
  showSkuField = false,
  allowListingTypeSwitch = false,
  showAdminListingFlags = false,
  subtitle = 'Rental listing form',
  submitCreateLabel = 'Save Product',
  submitEditLabel = 'Update Product',
  /** Tailwind classes for the primary submit button (footer). */
  submitPrimaryClassName = 'px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600',
  flexibleListingForm = false,
  /** localStorage key prefix; draft key is `${key}:${mode}:${id|new}`. */
  draftStorageKey = 'adminProductAddModalDraft',
  /** Called after a successful local draft write (e.g. refresh parent data). */
  onSaveDraft = null,
  /** When set while opening, replaces flexible form from saved draft (cleared by parent on close). */
  draftBootstrapPayload = null,
}) => {
  const dispatch = useDispatch();
  const { categories, subCategories } = useSelector((state) => state.category);

  const [form, setForm] = useState({ ...defaultForm });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [standardSearch, setStandardSearch] = useState('');
  const [standardCategoryFilter, setStandardCategoryFilter] = useState('all');
  const [standardFilterOpen, setStandardFilterOpen] = useState(false);
  const [templateApplyLoadingId, setTemplateApplyLoadingId] = useState(null);

  const filteredCategories = useMemo(() => {
    return (categories || []).filter((c) => {
      if (form.type === 'Sell') return c.availableInBuy;
      // default Rental form
      return c.availableInRent;
    });
  }, [categories, form.type]);

  const filteredSubCategories = useMemo(() => {
    return (subCategories || []).filter((s) => {
      if (form.type === 'Sell') return s.availableInBuy;
      return s.availableInRent;
    });
  }, [subCategories, form.type]);

  /** Draft restore: include saved main/sub even when flags hide them from filtered lists */
  const mainCategoryPickerItems = useMemo(() => {
    if (!flexibleListingForm) return filteredCategories;
    const fc = filteredCategories;
    const want = String(form.category || '')
      .trim()
      .toLowerCase();
    if (!want) return fc;
    const inFiltered = fc.some(
      (c) =>
        String(c.name || '')
          .trim()
          .toLowerCase() === want,
    );
    if (inFiltered) return fc;
    const extra = (categories || []).find(
      (c) =>
        String(c.name || '')
          .trim()
          .toLowerCase() === want,
    );
    return extra ? [...fc, extra] : fc;
  }, [flexibleListingForm, filteredCategories, categories, form.category]);

  const subCategoryPickerItems = useMemo(() => {
    if (!flexibleListingForm) return filteredSubCategories;
    const fs = filteredSubCategories;
    const want = String(form.subCategory || '')
      .trim()
      .toLowerCase();
    if (!want) return fs;
    const inFiltered = fs.some(
      (s) =>
        String(s.name || '')
          .trim()
          .toLowerCase() === want,
    );
    if (inFiltered) return fs;
    if (!selectedCategoryId) return fs;
    const extra = (subCategories || []).find(
      (s) =>
        String(s.name || '')
          .trim()
          .toLowerCase() === want &&
        String(s.category || '') === String(selectedCategoryId),
    );
    return extra ? [...fs, extra] : fs;
  }, [
    flexibleListingForm,
    filteredSubCategories,
    subCategories,
    form.subCategory,
    selectedCategoryId,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    // Load categories whenever modal opens
    dispatch(getCategories());

    if (initialData) {
      if (flexibleListingForm) {
        const productCustomSpecs =
          Array.isArray(initialData.productCustomSpecs) &&
          initialData.productCustomSpecs.length
            ? initialData.productCustomSpecs.map((r) => ({
                label: r.label || '',
                value: r.value || '',
              }))
            : specsObjectToRows(initialData.specifications);

        const variants =
          Array.isArray(initialData.variants) && initialData.variants.length
            ? initialData.variants.map(mapVariantFromApi)
            : [];

        const initType = initialData.type || 'Rental';
        setForm({
          ...defaultForm,
          sku: initialData.sku || '',
          productName: initialData.productName || '',
          type: initType,
          category: initialData.category || '',
          subCategory: initialData.subCategory || '',
          brand: initialData.brand || '',
          condition: normalizeConditionForListingType(
            initialData.condition,
            initType,
          ),
          shortDescription: initialData.shortDescription || '',
          description: initialData.description || '',
          specifications: {},
          productCustomSpecs:
            productCustomSpecs.length > 0
              ? productCustomSpecs
              : [{ label: '', value: '' }],
          variants,
          rentalConfigurations: [...defaultForm.rentalConfigurations],
          refundableDeposit: '',
          logisticsVerification: {
            inventoryOwnerName:
              initialData.logisticsVerification?.inventoryOwnerName || '',
            city: initialData.logisticsVerification?.city || '',
          },
          price: initialData.price || '',
          stock:
            initialData.stock === undefined || initialData.stock === null
              ? ''
              : String(initialData.stock),
          status: initialData.status || 'Active',
          isActive: initialData.isActive !== false,
          images: [],
          existingImages: Array.isArray(initialData.images)
            ? initialData.images.filter(Boolean).slice(0, 10)
            : initialData.image
              ? [initialData.image]
              : [],
          salesConfiguration: {
            allowVendorEditSalePrice:
              initialData.salesConfiguration?.allowVendorEditSalePrice !==
              false,
            salePrice:
              initialData.salesConfiguration?.salePrice === undefined ||
              initialData.salesConfiguration?.salePrice === null
                ? ''
                : String(initialData.salesConfiguration.salePrice),
            mrpPrice:
              initialData.salesConfiguration?.mrpPrice === undefined ||
              initialData.salesConfiguration?.mrpPrice === null
                ? ''
                : String(initialData.salesConfiguration.mrpPrice),
          },
        });
      } else {
        const initType = initialData.type || 'Rental';
        setForm({
          sku: initialData.sku || '',
          productName: initialData.productName || '',
          type: initType,
          category: initialData.category || '',
          subCategory: initialData.subCategory || '',
          brand: initialData.brand || '',
          condition: normalizeConditionForListingType(
            initialData.condition,
            initType,
          ),
          shortDescription: initialData.shortDescription || '',
          description: initialData.description || '',
          specifications: initialData.specifications || {},
          productCustomSpecs: [{ label: '', value: '' }],
          variants:
            Array.isArray(initialData.variants) && initialData.variants.length
              ? initialData.variants.map((v) => ({
                  _clientKey: v._clientKey || newVariantClientKey(),
                  variantName: v.variantName || '',
                  color: v.color || '',
                  storage: v.storage || '',
                  ram: v.ram || '',
                  condition: normalizeConditionForListingType(
                    v.condition || initialData.condition,
                    initType,
                  ),
                  price: v.price || '',
                  stock:
                    v.stock === undefined || v.stock === null
                      ? ''
                      : String(v.stock),
                }))
              : [...defaultForm.variants],
          rentalConfigurations:
            Array.isArray(initialData.rentalConfigurations) &&
            initialData.rentalConfigurations.length
              ? initialData.rentalConfigurations.map((cfg) => ({
                  months: cfg.months || 1,
                  label: cfg.label || '',
                  pricePerDay:
                    cfg.pricePerDay === undefined || cfg.pricePerDay === null
                      ? ''
                      : String(cfg.pricePerDay),
                }))
              : [...defaultForm.rentalConfigurations],
          refundableDeposit:
            initialData.refundableDeposit === undefined ||
            initialData.refundableDeposit === null
              ? ''
              : String(initialData.refundableDeposit),
          logisticsVerification: {
            inventoryOwnerName:
              initialData.logisticsVerification?.inventoryOwnerName || '',
            city: initialData.logisticsVerification?.city || '',
          },
          price: initialData.price || '',
          stock:
            initialData.stock === undefined || initialData.stock === null
              ? ''
              : String(initialData.stock),
          status: initialData.status || 'Active',
          isActive: initialData.isActive !== false,
          images: [],
          existingImages: Array.isArray(initialData.images)
            ? initialData.images.filter(Boolean).slice(0, 10)
            : initialData.image
              ? [initialData.image]
              : [],
          salesConfiguration: {
            allowVendorEditSalePrice:
              initialData.salesConfiguration?.allowVendorEditSalePrice !==
              false,
            salePrice:
              initialData.salesConfiguration?.salePrice === undefined ||
              initialData.salesConfiguration?.salePrice === null
                ? ''
                : String(initialData.salesConfiguration.salePrice),
            mrpPrice:
              initialData.salesConfiguration?.mrpPrice === undefined ||
              initialData.salesConfiguration?.mrpPrice === null
                ? ''
                : String(initialData.salesConfiguration.mrpPrice),
          },
        });
      }
    } else if (flexibleListingForm) {
      // Local draft restore: dedicated effect hydrates form + category; do not wipe here
      // (otherwise selectedCategoryId is cleared and category tiles / subs never match).
      if (draftBootstrapPayload?.form) {
        return;
      }
      setForm({
        ...defaultForm,
        variants: [],
        productCustomSpecs: [{ label: '', value: '' }],
      });
      setSelectedCategoryId('');
    } else {
      setForm({ ...defaultForm });
      setSelectedCategoryId('');
    }
  }, [
    isOpen,
    initialData,
    draftBootstrapPayload,
    dispatch,
    flexibleListingForm,
  ]);

  useLayoutEffect(() => {
    if (!isOpen || !flexibleListingForm || !draftBootstrapPayload?.form) {
      return;
    }
    const next = flexibleListingFormFromSerializedDraft(
      draftBootstrapPayload.form,
    );
    if (next) {
      setForm(next);
    }
  }, [isOpen, flexibleListingForm, draftBootstrapPayload]);

  useEffect(() => {
    if (!isOpen) return;
    setStandardSearch('');
    setStandardCategoryFilter('all');
    setStandardFilterOpen(false);
  }, [isOpen]);

  // When categories are loaded and we are editing, map category name -> id and load subcategories
  useEffect(() => {
    if (!isOpen || !initialData || !categories.length) return;

    const cn = String(initialData.category || '').trim();
    if (!cn) return;
    const matched = categories.find((c) => String(c.name || '').trim() === cn);
    if (matched) {
      setSelectedCategoryId(matched._id);
      dispatch(getSubCategories(matched._id));
    }
  }, [isOpen, initialData, categories, dispatch]);

  // Flexible Custom Listings: map saved `form.category` (draft / edit / clone) → main category tile + fetch subs
  useEffect(() => {
    if (!isOpen || !flexibleListingForm) return;
    const catName = String(form.category || '').trim();
    if (!catName || !categories.length) return;
    const want = catName.toLowerCase();
    const matched = categories.find(
      (c) =>
        String(c.name || '')
          .trim()
          .toLowerCase() === want,
    );
    if (!matched) return;
    if (selectedCategoryId !== matched._id) {
      setSelectedCategoryId(matched._id);
    }
    dispatch(getSubCategories(matched._id));
  }, [
    isOpen,
    flexibleListingForm,
    form.category,
    categories,
    selectedCategoryId,
    draftBootstrapPayload,
    dispatch,
  ]);

  // Create mode + template apply: keep category/subcategory selects in sync with form.category
  useEffect(() => {
    if (!isOpen || flexibleListingForm || initialData) return;
    if (!String(form.category || '').trim() || !categories.length) return;
    const matched = categories.find((c) => c.name === form.category);
    if (!matched) return;
    if (selectedCategoryId === matched._id) return;
    setSelectedCategoryId(matched._id);
    dispatch(getSubCategories(matched._id));
  }, [
    isOpen,
    form.category,
    categories,
    selectedCategoryId,
    dispatch,
    flexibleListingForm,
    initialData,
  ]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      setForm((prev) => {
        const remainingSlots = Math.max(
          0,
          10 - (prev.existingImages?.length || 0) - prev.images.length,
        );
        const selected = Array.from(files || []).slice(0, remainingSlots);
        return { ...prev, images: [...prev.images, ...selected] };
      });
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const applyCategorySelection = (id) => {
    setSelectedCategoryId(id);
    const cat = categories.find((c) => c._id === id);
    const categoryName = cat?.name || '';
    setForm((prev) => ({
      ...prev,
      category: categoryName,
      subCategory: '',
      specifications: {},
      ...(flexibleListingForm
        ? { productCustomSpecs: [{ label: '', value: '' }] }
        : {}),
    }));
    if (id) {
      dispatch(getSubCategories(id));
    }
  };

  const applySubCategorySelection = (id) => {
    const sub = subCategories.find((s) => s._id === id);
    const subName = sub?.name || '';
    setForm((prev) => ({
      ...prev,
      subCategory: subName,
    }));
  };

  const handleSaveDraft = () => {
    const base =
      String(draftStorageKey || 'adminProductAddModalDraft').trim() ||
      'adminProductAddModalDraft';
    const editId = initialData?._id || initialData?.id || 'new';
    const storageKey = `${base}:${mode}:${editId}`;
    const payload = buildDraftPayload(form, mode, initialData);
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      toast.success('Draft saved. Returning to the list…');
      onSaveDraft?.(payload);
    } catch (err) {
      console.error(err);
      toast.error(
        'Could not save draft. Check browser storage or try a smaller form.',
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!String(form.category || '').trim()) {
      toast.error('Please select a main category.');
      return;
    }
    if (!String(form.subCategory || '').trim()) {
      toast.error('Please select a sub-category.');
      return;
    }
    if (!String(form.productName || '').trim()) {
      toast.error('Please enter a product title.');
      return;
    }
    if (!String(form.description || '').trim()) {
      toast.error('Please enter a description.');
      return;
    }
    if (flexibleListingForm) {
      if (!form.variants?.length) {
        toast.error('Add at least one product variant.');
        return;
      }
      for (let i = 0; i < form.variants.length; i++) {
        if (!String(form.variants[i]?.variantName || '').trim()) {
          toast.error(`Variant ${i + 1}: enter a variant name.`);
          return;
        }
      }
      const hasVariantImg = form.variants.some(
        (v) =>
          (v.images && v.images.length > 0) ||
          (v.existingVariantImages && v.existingVariantImages.length > 0),
      );
      if (mode === 'create' && !hasVariantImg) {
        toast.error('Add at least one image on a variant.');
        return;
      }

      const trimmedPrice = String(form.price ?? '').trim();
      const anyVariantPrice = (form.variants || [])
        .map((v) => String(v?.price ?? '').trim())
        .find((p) => p.length > 0);
      const derivedPrice =
        trimmedPrice !== '' ? trimmedPrice : anyVariantPrice || '0';

      const sumVariantStock = (form.variants || []).reduce(
        (a, v) => a + (Number(v.stock) || 0),
        0,
      );
      const firstVariantStock = Number(form.variants[0]?.stock) || 0;
      const formStockStr = form.stock;
      const hasFormStock =
        formStockStr !== '' &&
        formStockStr !== null &&
        formStockStr !== undefined &&
        !Number.isNaN(Number(formStockStr));
      const derivedStockNum = hasFormStock
        ? Number(formStockStr)
        : sumVariantStock || firstVariantStock;
      const derivedStock = String(derivedStockNum);

      const cond = normalizeConditionForListingType(form.condition, form.type);
      onSubmit?.({
        ...form,
        condition: cond,
        price: derivedPrice,
        stock: derivedStock,
      });
      return;
    }
    const cond = normalizeConditionForListingType(form.condition, form.type);
    const variantsNormalized =
      form.type === 'Sell'
        ? (form.variants || []).map((v) => ({
            ...v,
            condition: normalizeConditionForListingType(
              v.condition || cond,
              'Sell',
            ),
          }))
        : form.variants;
    onSubmit?.({ ...form, condition: cond, variants: variantsNormalized });
  };

  const categoryKey = String(form.category || '').toLowerCase();
  const specKeys = categoryKey.includes('furniture')
    ? 'furniture'
    : categoryKey.includes('vehicle') || categoryKey.includes('car')
      ? 'vehicle'
      : 'electronics';
  const activeSpecFields = SPEC_FIELDS_BY_CATEGORY[specKeys];

  const handleSpecChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      specifications: {
        ...(prev.specifications || {}),
        [field]: value,
      },
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v,
      ),
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        flexibleListingForm ? emptyFlexibleVariant() : legacyEmptyVariant(),
      ],
    }));
  };

  const removeVariant = (index) => {
    setForm((prev) => {
      if (!flexibleListingForm && prev.variants.length <= 1) return prev;
      return {
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      };
    });
  };

  const addProductSpecRow = () => {
    setForm((prev) => ({
      ...prev,
      productCustomSpecs: [
        ...(prev.productCustomSpecs || [{ label: '', value: '' }]),
        { label: '', value: '' },
      ],
    }));
  };

  const updateProductSpecRow = (rowIdx, key, value) => {
    setForm((prev) => ({
      ...prev,
      productCustomSpecs: (prev.productCustomSpecs || []).map((row, i) =>
        i === rowIdx ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const removeProductSpecRow = (rowIdx) => {
    setForm((prev) => {
      const next = (prev.productCustomSpecs || []).filter(
        (_, i) => i !== rowIdx,
      );
      return {
        ...prev,
        productCustomSpecs: next.length ? next : [{ label: '', value: '' }],
      };
    });
  };

  const addVariantSpecRow = (vIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              specRows: [...(v.specRows || []), { label: '', value: '' }],
            }
          : v,
      ),
    }));
  };

  const updateVariantSpecRow = (vIdx, rowIdx, key, value) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              specRows: (v.specRows || []).map((row, j) =>
                j === rowIdx ? { ...row, [key]: value } : row,
              ),
            }
          : v,
      ),
    }));
  };

  const removeVariantSpecRow = (vIdx, rowIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== vIdx) return v;
        const next = (v.specRows || []).filter((_, j) => j !== rowIdx);
        return {
          ...v,
          specRows: next.length ? next : [{ label: '', value: '' }],
        };
      }),
    }));
  };

  const updateVariantRentalConfig = (vIdx, cfgIdx, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              rentalConfigurations: (v.rentalConfigurations || []).map(
                (cfg, j) => (j === cfgIdx ? { ...cfg, [field]: value } : cfg),
              ),
            }
          : v,
      ),
    }));
  };

  const setVariantRentalPricingModel = (vIdx, model) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              rentalPricingModel: model,
              rentalConfigurations:
                model === 'day'
                  ? defaultRentalTermsDay()
                  : defaultRentalTermsMonth(),
            }
          : v,
      ),
    }));
  };

  const addVariantRentalTerm = (vIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== vIdx) return v;
        const unit = v.rentalPricingModel === 'day' ? 'day' : 'month';
        const list = [...(v.rentalConfigurations || [])];
        const last = list[list.length - 1] || {};
        let preset;
        if (unit === 'month') {
          const nextM = (numOr(last.months, 12) || 12) + 3;
          preset = { months: nextM, tierLabel: '', label: `${nextM} Months` };
        } else {
          const nextD = (numOr(last.days, 7) || 7) + 2;
          preset = { days: nextD, tierLabel: '', label: `${nextD} Days` };
        }
        list.push(emptyRentalTier(preset, unit));
        return { ...v, rentalConfigurations: list };
      }),
    }));
  };

  const removeVariantRentalTerm = (vIdx, cfgIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== vIdx) return v;
        const list = v.rentalConfigurations || [];
        if (list.length <= 1) return v;
        return {
          ...v,
          rentalConfigurations: list.filter((_, j) => j !== cfgIdx),
        };
      }),
    }));
  };

  const applyVariantImageFiles = (vIdx, fileList) => {
    const picked = Array.from(fileList || []).filter((f) =>
      String(f?.type || '').startsWith('image/'),
    );
    if (!picked.length) return;
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== vIdx) return v;
        const existing = (v.existingVariantImages || []).length;
        const current = (v.images || []).length;
        const room = Math.max(0, 10 - existing - current);
        const selected = picked.slice(0, room);
        if (!selected.length) return v;
        return {
          ...v,
          images: [...(v.images || []), ...selected],
        };
      }),
    }));
  };

  const onVariantFiles = (vIdx, e) => {
    applyVariantImageFiles(vIdx, e.target.files);
    e.target.value = '';
  };

  const onVariantFilesDragDrop = (vIdx, e) => {
    e.preventDefault();
    e.stopPropagation();
    applyVariantImageFiles(vIdx, e.dataTransfer?.files);
  };

  const removeVariantNewImage = (vIdx, imgIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              images: (v.images || []).filter((_, j) => j !== imgIdx),
            }
          : v,
      ),
    }));
  };

  const removeVariantExistingImage = (vIdx, imgIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              existingVariantImages: (v.existingVariantImages || []).filter(
                (_, j) => j !== imgIdx,
              ),
            }
          : v,
      ),
    }));
  };

  const updateRentalConfig = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      rentalConfigurations: prev.rentalConfigurations.map((cfg, i) =>
        i === index ? { ...cfg, [field]: value } : cfg,
      ),
    }));
  };

  const handleLogisticsChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      logisticsVerification: {
        ...(prev.logisticsVerification || {}),
        [field]: value,
      },
    }));
  };

  const standardProductCategories = useMemo(() => {
    const set = new Set();
    (existingProducts || []).forEach((p) => {
      const c = String(p?.category || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [existingProducts]);

  const filteredStandardProducts = useMemo(() => {
    const term = standardSearch.trim().toLowerCase();
    return (existingProducts || [])
      .filter((p) => p?._id && p._id !== initialData?._id)
      .filter((p) => {
        if (standardCategoryFilter && standardCategoryFilter !== 'all') {
          if (String(p.category || '') !== standardCategoryFilter) return false;
        }
        if (!term) return true;
        const name = String(p.productName || '').toLowerCase();
        const category = String(p.category || '').toLowerCase();
        const sub = String(p.subCategory || '').toLowerCase();
        const sku = String(p.sku || '').toLowerCase();
        return (
          name.includes(term) ||
          category.includes(term) ||
          sub.includes(term) ||
          sku.includes(term)
        );
      })
      .slice(0, 500);
  }, [existingProducts, standardSearch, initialData, standardCategoryFilter]);

  const existingImageUrls = useMemo(
    () => (Array.isArray(form.existingImages) ? form.existingImages : []),
    [form.existingImages],
  );

  const selectedImageUrls = useMemo(
    () => form.images.map((img) => URL.createObjectURL(img)),
    [form.images],
  );

  const addVariantFromProduct = (product) => {
    if (flexibleListingForm) {
      setForm((prev) => ({
        ...prev,
        variants: [
          ...prev.variants,
          {
            ...emptyFlexibleVariant(),
            variantName: product.productName || '',
            price: product.price || '',
            stock:
              product.stock === undefined || product.stock === null
                ? ''
                : String(product.stock),
            rentalConfigurations: rentalConfigsFromStandardProduct(product),
            existingVariantImages: existingImagesFromStandardProduct(product),
          },
        ],
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          variantName: product.productName || '',
          color: '',
          storage: '',
          ram: '',
          condition: product.condition || '',
          price: product.price || '',
          stock:
            product.stock === undefined || product.stock === null
              ? ''
              : String(product.stock),
        },
      ],
    }));
  };

  const handleStandardCatalogRowAdd = async (p) => {
    if (!standardCatalogPopulateFullForm) {
      addVariantFromProduct(p);
      return;
    }
    if (fetchStandardListingTemplate) {
      setTemplateApplyLoadingId(p._id);
      try {
        const template = await fetchStandardListingTemplate(p._id);
        if (!template) {
          toast.error('Could not load listing template.');
          return;
        }
        setForm(buildVendorFormStateFromListingTemplate(template));
        toast.success(
          'Template loaded — adjust details and save your listing.',
        );
      } catch (err) {
        toast.error(
          err?.response?.data?.message || 'Failed to load listing template.',
        );
      } finally {
        setTemplateApplyLoadingId(null);
      }
      return;
    }
    setForm(buildVendorFormStateFromListingTemplate(p));
    toast.success('Template loaded — adjust details and save your listing.');
  };

  const removeExistingImage = (index) => {
    setForm((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index),
    }));
  };

  const removeSelectedImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-4">
      <div className="flex min-h-0 w-full max-w-5xl max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'edit' ? modalTitleEdit : modalTitleCreate}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <form
            onSubmit={handleSubmit}
            className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {!allowListingTypeSwitch ? (
              <input
                type="hidden"
                name="type"
                value="Rental"
                className="hidden"
                aria-hidden
              />
            ) : null}
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              {allowListingTypeSwitch ? (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => {
                        const next = { ...prev, type: 'Sell' };
                        next.condition = normalizeConditionForListingType(
                          prev.condition,
                          'Sell',
                        );
                        if (prev.type !== 'Sell' && !flexibleListingForm) {
                          next.variants = (prev.variants || []).map((v) => ({
                            ...v,
                            condition: normalizeConditionForListingType(
                              v.condition || next.condition,
                              'Sell',
                            ),
                          }));
                        }
                        return next;
                      })
                    }
                    className={`flex flex-row items-center justify-center gap-3 rounded-xl border-2 px-4 py-3.5 transition ${
                      form.type === 'Sell'
                        ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-200'
                        : 'border-gray-200 bg-white opacity-60'
                    } cursor-pointer opacity-100`}
                  >
                    <Tag
                      className="h-6 w-6 shrink-0 text-gray-600"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <div className="min-w-0 text-left">
                      <p
                        className={`text-sm font-semibold leading-tight ${
                          form.type === 'Sell'
                            ? 'text-blue-600'
                            : 'text-gray-900'
                        }`}
                      >
                        Sell Product
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                        One-time purchase
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => {
                        const next = { ...prev, type: 'Rental' };
                        next.condition = normalizeConditionForListingType(
                          prev.condition,
                          'Rental',
                        );
                        if (prev.type === 'Sell' && !flexibleListingForm) {
                          next.variants = (prev.variants || []).map((v) => ({
                            ...v,
                            condition: normalizeConditionForListingType(
                              v.condition || next.condition,
                              'Rental',
                            ),
                          }));
                        }
                        return next;
                      })
                    }
                    className={`flex flex-row items-center justify-center gap-3 rounded-xl border-2 px-4 py-3.5 transition ${
                      form.type !== 'Sell'
                        ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-200'
                        : 'border-gray-200 bg-white opacity-60'
                    } cursor-pointer opacity-100`}
                  >
                    <RentOutListingIcon className="h-6 w-6 shrink-0 object-contain" />
                    <div className="min-w-0 text-left">
                      <p
                        className={`text-sm font-semibold leading-tight ${
                          form.type !== 'Sell'
                            ? 'text-blue-600'
                            : 'text-gray-900'
                        }`}
                      >
                        Rent Out
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                        Monthly rental
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-4 text-center opacity-60 cursor-not-allowed"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      Offer Service
                    </p>
                    <p className="text-[11px] leading-snug text-gray-500">
                      Coming soon
                    </p>
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-orange-300 text-orange-600 bg-orange-50 text-center py-2 text-sm font-medium">
                    Add Rental
                  </div>
                  <div className="rounded-xl border text-gray-400 bg-gray-50 text-center py-2 text-sm">
                    Sales Configuration (Later)
                  </div>
                </>
              )}
            </div>

            {/* Category / subcategory — same shell + header as Search Standard; placed above catalog search */}
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/70">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Tag className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">
                      {form.type === 'Sell'
                        ? 'What are you listing?'
                        : 'What are you renting?'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select category to see relevant fields
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5 space-y-6">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Step 1: Main Category{' '}
                    <span className="text-red-500">*</span>
                  </p>
                  {mainCategoryPickerItems.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      No categories available for this listing type.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                      {mainCategoryPickerItems.map((c) => {
                        const selected = selectedCategoryId === c._id;
                        const asset = categoryOrSubAssetUrl(c);
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => applyCategorySelection(c._id)}
                            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 min-h-[5.5rem] text-center transition ${
                              selected
                                ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50/80'
                            }`}
                          >
                            {asset ? (
                              <img
                                src={asset}
                                alt=""
                                className={`h-10 w-10 sm:h-11 sm:w-11 object-contain ${
                                  selected ? '' : 'opacity-90'
                                }`}
                              />
                            ) : (
                              <Package
                                className={`h-10 w-10 sm:h-11 sm:w-11 shrink-0 ${
                                  selected ? 'text-orange-500' : 'text-gray-400'
                                }`}
                                strokeWidth={1.75}
                              />
                            )}
                            <span
                              className={`text-[11px] sm:text-xs font-medium leading-tight line-clamp-2 w-full ${
                                selected ? 'text-orange-600' : 'text-gray-600'
                              }`}
                            >
                              {c.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Step 2: Sub Category <span className="text-red-500">*</span>
                  </p>
                  {!selectedCategoryId ? (
                    <p className="text-sm text-gray-500 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center">
                      Choose a main category first.
                    </p>
                  ) : subCategoryPickerItems.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      No sub-categories for this category yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                      {subCategoryPickerItems.map((s) => {
                        const selected =
                          String(form.subCategory || '')
                            .trim()
                            .toLowerCase() ===
                          String(s.name || '')
                            .trim()
                            .toLowerCase();
                        const asset = categoryOrSubAssetUrl(s);
                        return (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => applySubCategorySelection(s._id)}
                            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 min-h-[5.5rem] text-center transition ${
                              selected
                                ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50/80'
                            }`}
                          >
                            {asset ? (
                              <img
                                src={asset}
                                alt=""
                                className={`h-10 w-10 sm:h-11 sm:w-11 object-contain ${
                                  selected ? '' : 'opacity-90'
                                }`}
                              />
                            ) : (
                              <Package
                                className={`h-10 w-10 sm:h-11 sm:w-11 shrink-0 ${
                                  selected ? 'text-orange-500' : 'text-gray-400'
                                }`}
                                strokeWidth={1.75}
                              />
                            )}
                            <span
                              className={`text-[11px] sm:text-xs font-medium leading-tight line-clamp-2 w-full ${
                                selected ? 'text-orange-600' : 'text-gray-600'
                              }`}
                            >
                              {s.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {enableStandardProductSearch ? (
              <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/70">
                  <div className="flex items-start gap-3">
                    {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Tag className="h-5 w-5" strokeWidth={2} />
                  </div> */}
                    {/* <div className="min-w-0"> */}
                    {/* <h2 className="text-base font-semibold text-gray-900">
                      Search Standard Listed Products
                    </h2> */}
                    {/* <p className="text-xs text-gray-500 mt-0.5">
                      {standardCatalogTableOnly
                        ? 'Same templates as on the Custom Listings page — search and filter below'
                        : standardCatalogPopulateFullForm
                          ? 'Pick an admin template and tap Add to fill the form — then save as your vendor listing'
                          : 'Add multiple product variants'}
                    </p> */}
                    {/* </div> */}
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                        aria-hidden
                      />
                      <input
                        type="search"
                        value={standardSearch}
                        onChange={(e) => setStandardSearch(e.target.value)}
                        placeholder={standardSearchPlaceholder}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                        autoComplete="off"
                      />
                    </div>
                    {standardCatalogShowCustomListingButton ? (
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...defaultForm });
                          setSelectedCategoryId('');
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shrink-0 hover:bg-orange-600"
                      >
                        Custom Listing
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setStandardFilterOpen((o) => !o)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shrink-0 ${
                        standardCategoryFilter !== 'all'
                          ? 'border-orange-300 bg-orange-50 text-orange-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                    </button>
                  </div>
                  {standardFilterOpen ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">Category</span>
                      <select
                        value={standardCategoryFilter}
                        onChange={(e) =>
                          setStandardCategoryFilter(e.target.value)
                        }
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[160px]"
                        aria-label="Filter by category"
                      >
                        <option value="all">All categories</option>
                        {standardProductCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
                <div className="max-h-[min(360px,50vh)] overflow-y-auto">
                  {standardCatalogLoading &&
                  (existingProducts || []).length === 0 ? (
                    <div className="px-4 py-12 flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="inline-flex h-9 w-9 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      Loading listed products…
                    </div>
                  ) : filteredStandardProducts.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-500">
                      {(existingProducts || []).filter(
                        (p) => p?._id && p._id !== initialData?._id,
                      ).length === 0
                        ? standardCatalogTableOnly
                          ? 'No custom listing templates yet. Save one from the form below or use Add New Product.'
                          : 'No listed products available. Create standard products first, or add variants manually below.'
                        : 'No products match your search or filter.'}
                    </p>
                  ) : standardCatalogTableOnly ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]">
                          <tr className="text-left text-gray-600">
                            <th className="px-4 py-3 font-medium">Product</th>
                            {/* <th className="px-4 py-3 font-medium">Type</th> */}
                            <th className="px-4 py-3 font-medium">Category</th>
                            <th className="px-4 py-3 font-medium">
                              Sub-category
                            </th>
                            {/* <th className="px-4 py-3 font-medium">Status</th> */}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredStandardProducts.map((p) => (
                            <tr
                              key={p._id}
                              className="hover:bg-gray-50/80 text-gray-700"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <img
                                    src={standardProductThumbUrl(p)}
                                    alt=""
                                    className="w-11 h-11 rounded-lg object-cover border border-gray-100 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {p.productName}
                                    </p>
                                    <p className="text-xs text-gray-500 tabular-nums">
                                      {standardCatalogProductSubprice(p)}
                                    </p>
                                    {p.sku ? (
                                      <p className="text-[11px] text-gray-400 mt-0.5">
                                        SKU: {p.sku}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">{p.category || '—'}</td>
                              <td className="px-4 py-3">
                                {p.subCategory || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {filteredStandardProducts.map((p) => (
                        <li key={p._id}>
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80">
                            <img
                              src={standardProductThumbUrl(p)}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-lg object-cover border border-gray-100"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {p.productName}
                              </p>
                              <p className="text-xs text-gray-500 tabular-nums">
                                {standardProductPriceLabel(p)}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5 sm:hidden">
                                {[p.category, p.subCategory]
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </p>
                            </div>
                            <div className="hidden sm:block w-[7.5rem] shrink-0 text-xs text-gray-600 truncate">
                              {p.category || '—'}
                            </div>
                            <div className="hidden md:block w-[7.5rem] shrink-0 text-xs text-gray-600 truncate">
                              {p.subCategory || '—'}
                            </div>
                            <button
                              type="button"
                              disabled={!!templateApplyLoadingId}
                              onClick={() => handleStandardCatalogRowAdd(p)}
                              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 ${
                                standardCatalogPopulateFullForm
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'bg-orange-500 hover:bg-orange-600'
                              }`}
                            >
                              {templateApplyLoadingId === p._id ? '…' : 'Add'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}

            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Basic Details
              </h2>
              <div className="space-y-4">
                {!allowListingTypeSwitch ? (
                  <p className="text-xs text-gray-600 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-800">
                      Listing type:
                    </span>{' '}
                    Rental
                  </p>
                ) : null}
                <div>
                  <label
                    htmlFor="admin-product-title"
                    className="block text-sm font-medium text-gray-900 mb-1"
                  >
                    Product title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="admin-product-title"
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    placeholder="e.g., Samsung Galaxy S23"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="admin-product-brand"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      Brand
                    </label>
                    <input
                      id="admin-product-brand"
                      name="brand"
                      value={form.brand}
                      onChange={handleChange}
                      placeholder="e.g., Samsung"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-listing-condition"
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      Condition <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="admin-listing-condition"
                      name="condition"
                      value={normalizeConditionForListingType(
                        form.condition,
                        allowListingTypeSwitch
                          ? form.type === 'Sell'
                            ? 'Sell'
                            : 'Rental'
                          : 'Rental',
                      )}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                    >
                      {(allowListingTypeSwitch && form.type === 'Sell'
                        ? SELL_CONDITION_OPTIONS
                        : RENTAL_CONDITION_OPTIONS
                      ).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="admin-product-description"
                    className="block text-sm font-medium text-gray-900 mb-1"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="admin-product-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Provide detailed description including key features, condition, etc."
                    className="w-full min-h-[120px] resize-y border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>

            {flexibleListingForm ? (
              <>
                <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Tag className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900">
                          Product Variants
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Add multiple product variants
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 w-full sm:w-auto"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="p-4 sm:p-5">
                    {form.variants.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white divide-y divide-gray-100">
                        {form.variants.map((variant, index) => (
                          <div
                            key={`sum-${variant._clientKey || index}`}
                            className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-4"
                          >
                            <VariantListThumbnail variant={variant} />
                            <div className="min-w-0 flex-1 basis-[8rem]">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {String(variant.variantName || '').trim() ||
                                  `Variant ${index + 1}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {flexibleVariantPriceLine(variant, form.type)}
                              </p>
                            </div>
                            <div className="flex w-full gap-4 text-xs text-gray-600 sm:w-auto sm:text-sm">
                              <div className="min-w-0 flex-1 sm:w-28 sm:flex-none">
                                <span className="text-gray-400 sm:hidden">
                                  Category{' '}
                                </span>
                                <span className="truncate block">
                                  {form.category || '—'}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 sm:w-28 sm:flex-none">
                                <span className="text-gray-400 sm:hidden">
                                  Sub{' '}
                                </span>
                                <span className="truncate block">
                                  {form.subCategory || '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-1">
                        No variants yet. Click &quot;+ Add Variant&quot; to
                        create one.
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  {/* <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-4 sm:px-5">
                  <h2 className="text-base font-semibold text-gray-900">
                    Variant details
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Media, specifications, and rental settings for each variant.
                  </p>
                </div> */}
                  <div className="p-4 sm:p-5 space-y-5">
                    {form.variants.map((variant, index) => {
                      const mediaInputId = `variant-media-${variant._clientKey || index}`;
                      const existingCount = (
                        variant.existingVariantImages || []
                      ).length;
                      const newCount = (variant.images || []).length;
                      const mediaTotal = existingCount + newCount;
                      const mediaRoom = Math.max(0, 10 - mediaTotal);
                      return (
                        <div
                          key={variant._clientKey || `flex-${index}`}
                          className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 space-y-5 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {/* Variant {index + 1} */}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                            >
                              Remove variant
                            </button>
                          </div>

                          <div>
                            <label
                              htmlFor={`admin-flex-variant-name-${variant._clientKey || index}`}
                              className="block text-sm font-medium text-gray-900 mb-1.5"
                            >
                              Variant name{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              id={`admin-flex-variant-name-${variant._clientKey || index}`}
                              value={variant.variantName || ''}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  'variantName',
                                  e.target.value,
                                )
                              }
                              placeholder="eg. 5 Seater sofa"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                            />
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 space-y-3">
                            <div className="flex items-center gap-2">
                              <Package
                                className="h-4 w-4 shrink-0 text-violet-600"
                                strokeWidth={2}
                              />
                              <h3 className="text-sm font-semibold text-gray-900">
                                Product Media
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Upload up to 10 high-quality media. The first
                              image will be the cover photo.
                            </p>
                            {(variant.existingVariantImages || []).length >
                            0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {(variant.existingVariantImages || []).map(
                                  (src, vi) => (
                                    <div
                                      key={`ve-${vi}`}
                                      className="relative aspect-square rounded-lg border border-gray-100 overflow-hidden bg-gray-50"
                                    >
                                      <img
                                        src={src}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeVariantExistingImage(index, vi)
                                        }
                                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-black/85"
                                        aria-label="Remove image"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : null}
                            {(variant.images || []).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(variant.images || []).map((file, fi) => (
                                  <div
                                    key={fi}
                                    className="relative rounded-lg border border-gray-100 p-1 bg-gray-50"
                                  >
                                    <VariantNewImagePreview file={file} />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeVariantNewImage(index, fi)
                                      }
                                      className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                                      aria-label="Remove new image"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {mediaRoom > 0 ? (
                              <label
                                htmlFor={mediaInputId}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDrop={(e) => onVariantFilesDragDrop(index, e)}
                                className="relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center transition hover:border-violet-300 hover:bg-violet-50/30"
                              >
                                <Upload
                                  className="mb-2 h-9 w-9 text-blue-500"
                                  strokeWidth={1.75}
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  Click to upload or drag and drop
                                </span>
                                <span className="mt-1 text-xs text-gray-500">
                                  {mediaTotal}/10 uploaded
                                </span>
                                <input
                                  id={mediaInputId}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => onVariantFiles(index, e)}
                                  className="sr-only"
                                />
                              </label>
                            ) : (
                              <p className="text-center text-xs text-gray-500 py-2">
                                Maximum 10 images ({mediaTotal}/10 uploaded)
                              </p>
                            )}
                          </div>

                          {/* <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-start gap-2 min-w-0">
                                <Box
                                  className="mt-0.5 h-4 w-4 shrink-0 text-violet-600"
                                  strokeWidth={2}
                                />
                                <div>
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    Product Specifications
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                    Add custom fields for this variant (e.g.
                                    material, dimensions).
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => addVariantSpecRow(index)}
                                className="shrink-0 inline-flex items-center justify-center rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 w-full sm:w-auto"
                              >
                                + Add Custom Specification
                              </button>
                            </div>
                            <div className="space-y-2.5">
                              {(
                                variant.specRows || [{ label: '', value: '' }]
                              ).map((row, ri) => (
                                <div
                                  key={ri}
                                  className="flex flex-wrap gap-2 items-center"
                                >
                                  <input
                                    value={row.label}
                                    onChange={(e) =>
                                      updateVariantSpecRow(
                                        index,
                                        ri,
                                        'label',
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g., Fabric Material"
                                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                                  />
                                  <input
                                    value={row.value}
                                    onChange={(e) =>
                                      updateVariantSpecRow(
                                        index,
                                        ri,
                                        'value',
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g., Velvet"
                                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVariantSpecRow(index, ri)
                                    }
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
                                    aria-label="Remove specification"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div> */}
                          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <Box className="h-5 w-5 text-violet-600 mt-0.5" />
                                <div>
                                  <h3 className="text-base font-semibold text-gray-900">
                                    Product Specifications
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Add custom fields for this variant (e.g.
                                    material, dimensions).
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => addVariantSpecRow(index)}
                                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
                              >
                                + Add Custom Specification
                              </button>
                            </div>

                            <p className="text-sm text-gray-600">
                              Custom Specifications
                            </p>

                            <div className="bg-[#F7F5FF] border border-violet-200 rounded-2xl p-4 space-y-3">
                              {(
                                variant.specRows || [{ label: '', value: '' }]
                              ).map((row, ri) => (
                                <div
                                  key={ri}
                                  className="flex items-center gap-3"
                                >
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Label
                                    </p>
                                    <input
                                      value={row.label}
                                      onChange={(e) =>
                                        updateVariantSpecRow(
                                          index,
                                          ri,
                                          'label',
                                          e.target.value,
                                        )
                                      }
                                      placeholder="e.g., Fabric Material"
                                      className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none"
                                    />
                                  </div>

                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Value
                                    </p>
                                    <input
                                      value={row.value}
                                      onChange={(e) =>
                                        updateVariantSpecRow(
                                          index,
                                          ri,
                                          'value',
                                          e.target.value,
                                        )
                                      }
                                      placeholder="e.g., Velvet"
                                      className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVariantSpecRow(index, ri)
                                    }
                                    className="mt-5 h-10 w-10 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {form.type !== 'Sell' ? (
                            <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                                {/* <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center   text-emerald-600">
                                    <DollarSign
                                      className="h-5 w-5"
                                      strokeWidth={2}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-base font-semibold text-black">
                                      {form.type === 'Sell'
                                        ? 'Rental configuration (optional)'
                                        : 'Rental configuration'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Customer &amp; vendor pricing by term
                                    </p>
                                  </div>
                                </div> */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center text-emerald-600">
                                    <DollarSign
                                      className="h-4 w-4"
                                      strokeWidth={2}
                                    />
                                  </div>

                                  <div>
                                    <p className="text-base font-semibold text-black leading-none">
                                      {form.type === 'Sell'
                                        ? 'Rental configuration (optional)'
                                        : 'Rental configuration'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 sm:shrink-0">
                                  <span className="text-xs text-gray-600 max-w-[9rem] sm:max-w-none leading-tight">
                                    Allow vendors to edit prices
                                  </span>
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={
                                      variant.allowVendorEditRentalPrices !==
                                      false
                                    }
                                    onClick={() =>
                                      updateVariant(
                                        index,
                                        'allowVendorEditRentalPrices',
                                        !(
                                          variant.allowVendorEditRentalPrices !==
                                          false
                                        ),
                                      )
                                    }
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                      variant.allowVendorEditRentalPrices !==
                                      false
                                        ? 'bg-emerald-500'
                                        : 'bg-gray-300'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                                        variant.allowVendorEditRentalPrices !==
                                        false
                                          ? 'translate-x-5'
                                          : 'translate-x-0.5'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-white shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVariantRentalPricingModel(
                                        index,
                                        'month',
                                      )
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                                      variant.rentalPricingModel !== 'day'
                                        ? 'bg-white border border-amber-200 text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                  >
                                    <Calendar className="h-3.5 w-3.5" />
                                    Month-wise
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVariantRentalPricingModel(index, 'day')
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                                      variant.rentalPricingModel === 'day'
                                        ? 'bg-white border border-amber-200 text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                  >
                                    <Clock className="h-3.5 w-3.5" />
                                    Day-wise
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addVariantRentalTerm(index)}
                                  className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 shadow-sm w-full lg:w-auto"
                                >
                                  + Add more term
                                </button>
                              </div>

                              {[
                                'Customer configuration',
                                'Vendor configuration',
                              ].map((sectionTitle) => {
                                const isCustomer =
                                  sectionTitle === 'Customer configuration';
                                const rentField = isCustomer
                                  ? 'customerRent'
                                  : 'vendorRent';
                                const shipField = isCustomer
                                  ? 'customerShipping'
                                  : 'vendorShipping';
                                const rentLabel =
                                  variant.rentalPricingModel === 'day'
                                    ? 'Daily rent'
                                    : 'Monthly rent';
                                return (
                                  <div key={sectionTitle}>
                                    <p className="text-xs font-semibold text-gray-800 mb-2">
                                      {sectionTitle}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                      {(variant.rentalConfigurations || []).map(
                                        (cfg, cidx) => (
                                          // <div
                                          //   key={`${sectionTitle}-${cidx}`}
                                          //   className="rounded-xl border border-amber-200/90 bg-white p-3 shadow-sm space-y-2"
                                          // >
                                          //   <div className="flex items-start justify-between gap-1">
                                          //     <div className="min-w-0 flex-1 space-y-1">
                                          //       <input
                                          //         type="text"
                                          //         value={cfg.tierLabel || ''}
                                          //         onChange={(e) =>
                                          //           updateVariantRentalConfig(
                                          //             index,
                                          //             cidx,
                                          //             'tierLabel',
                                          //             e.target.value,
                                          //           )
                                          //         }
                                          //         placeholder="SHORT TERM"
                                          //         className="w-full text-[10px] font-semibold tracking-wide text-gray-400 uppercase border border-gray-200 rounded-lg px-2 py-1"
                                          //       />
                                          //       <input
                                          //         type="text"
                                          //         value={cfg.label || ''}
                                          //         onChange={(e) =>
                                          //           updateVariantRentalConfig(
                                          //             index,
                                          //             cidx,
                                          //             'label',
                                          //             e.target.value,
                                          //           )
                                          //         }
                                          //         placeholder={
                                          //           variant.rentalPricingModel ===
                                          //           'day'
                                          //             ? '3 Days'
                                          //             : '3 Months'
                                          //         }
                                          //         className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2 py-1"
                                          //       />
                                          //     </div>
                                          //     {(
                                          //       variant.rentalConfigurations ||
                                          //       []
                                          //     ).length > 1 ? (
                                          //       <button
                                          //         type="button"
                                          //         onClick={() =>
                                          //           removeVariantRentalTerm(
                                          //             index,
                                          //             cidx,
                                          //           )
                                          //         }
                                          //         className="shrink-0 text-gray-400 hover:text-red-600 text-sm px-1"
                                          //         aria-label="Remove term"
                                          //       >
                                          //         ×
                                          //       </button>
                                          //     ) : null}
                                          //   </div>
                                          //   <div>
                                          //     <label className="block text-[11px] text-gray-500 mb-1">
                                          //       {rentLabel}
                                          //     </label>
                                          //     <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20">
                                          //       <span className="flex items-center px-2.5 text-gray-500 text-sm bg-gray-50 border-r border-gray-200">
                                          //         ₹
                                          //       </span>
                                          //       <input
                                          //         type="number"
                                          //         value={cfg[rentField] ?? ''}
                                          //         onChange={(e) =>
                                          //           updateVariantRentalConfig(
                                          //             index,
                                          //             cidx,
                                          //             rentField,
                                          //             e.target.value,
                                          //           )
                                          //         }
                                          //         placeholder="0"
                                          //         className="min-w-0 flex-1 border-0 px-2 py-2 text-sm outline-none"
                                          //       />
                                          //     </div>
                                          //   </div>
                                          //   <div>
                                          //     <label className="block text-[11px] text-gray-500 mb-1">
                                          //       Shipping charges
                                          //     </label>
                                          //     <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20">
                                          //       <span className="flex items-center px-2.5 text-gray-500 text-sm bg-gray-50 border-r border-gray-200">
                                          //         ₹
                                          //       </span>
                                          //       <input
                                          //         type="number"
                                          //         value={cfg[shipField] ?? ''}
                                          //         onChange={(e) =>
                                          //           updateVariantRentalConfig(
                                          //             index,
                                          //             cidx,
                                          //             shipField,
                                          //             e.target.value,
                                          //           )
                                          //         }
                                          //         placeholder="0"
                                          //         className="min-w-0 flex-1 border-0 px-2 py-2 text-sm outline-none"
                                          //       />
                                          //     </div>
                                          //   </div>
                                          // </div>
                                          <div
                                            key={`${sectionTitle}-${cidx}`}
                                            className="rounded-2xl border-2 border-orange-300 bg-[#FFFDF8] p-5 space-y-4"
                                          >
                                            <div className="space-y-1">
                                              <input
                                                type="text"
                                                value={cfg.tierLabel || ''}
                                                onChange={(e) =>
                                                  updateVariantRentalConfig(
                                                    index,
                                                    cidx,
                                                    'tierLabel',
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder="SHORT TERM"
                                                className="w-full text-[11px] font-semibold tracking-wide text-gray-400 uppercase border-0 p-0 bg-transparent"
                                              />

                                              <input
                                                type="text"
                                                value={cfg.label || ''}
                                                onChange={(e) =>
                                                  updateVariantRentalConfig(
                                                    index,
                                                    cidx,
                                                    'label',
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder={
                                                  variant.rentalPricingModel ===
                                                  'day'
                                                    ? '3 Days'
                                                    : '3 Months'
                                                }
                                                className="w-full text-lg font-semibold text-gray-900 border-0 p-0 bg-transparent"
                                              />
                                            </div>

                                            {/* Rent */}
                                            <div>
                                              <label className="block text-sm text-gray-600 mb-2">
                                                {rentLabel}
                                              </label>

                                              <div className="flex items-center rounded-xl border-2 border-orange-300 bg-white overflow-hidden">
                                                <span className="px-3 text-gray-500">
                                                  ₹
                                                </span>

                                                <input
                                                  type="number"
                                                  value={cfg[rentField] ?? ''}
                                                  onChange={(e) =>
                                                    updateVariantRentalConfig(
                                                      index,
                                                      cidx,
                                                      rentField,
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="999"
                                                  className="w-full px-2 py-2.5 outline-none"
                                                />
                                              </div>
                                            </div>

                                            {/* Shipping */}
                                            <div>
                                              <label className="block text-sm text-gray-600 mb-2">
                                                Shipping charges
                                              </label>

                                              <div className="flex items-center rounded-xl border-2 border-orange-300 bg-white overflow-hidden">
                                                <span className="px-3 text-gray-500">
                                                  ₹
                                                </span>

                                                <input
                                                  type="number"
                                                  value={cfg[shipField] ?? ''}
                                                  onChange={(e) =>
                                                    updateVariantRentalConfig(
                                                      index,
                                                      cidx,
                                                      shipField,
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="999"
                                                  className="w-full px-2 py-2.5 outline-none"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}

                          {form.type !== 'Sell' ? (
                            // <div>
                            //   <p className="text-sm font-medium text-gray-900 mb-1">
                            //     Refundable deposit
                            //   </p>
                            //   <input
                            //     type="number"
                            //     value={variant.refundableDeposit || ''}
                            //     onChange={(e) =>
                            //       updateVariant(
                            //         index,
                            //         'refundableDeposit',
                            //         e.target.value,
                            //       )
                            //     }
                            //     placeholder="Amount"
                            //     className="w-full md:w-1/2 border rounded-lg px-3 py-2 text-sm"
                            //   />
                            // </div>
                            <div className="bg-[#F7F5FF] border border-purple-200 rounded-2xl p-4 md:p-5">
                              <p className="text-sm font-semibold text-gray-900">
                                Refundable Deposit
                              </p>

                              <p className="text-xs text-gray-500 mt-1 mb-3">
                                Security deposit returned after rental period
                                ends
                              </p>

                              <div className="relative w-full md:w-1/2">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                  ₹
                                </span>

                                <input
                                  type="number"
                                  value={variant.refundableDeposit || ''}
                                  onChange={(e) =>
                                    updateVariant(
                                      index,
                                      'refundableDeposit',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="5000"
                                  className="w-full border border-purple-200 rounded-xl pl-7 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2 border-t pt-4 mt-1">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Product Specifications (
                    {specKeys === 'furniture'
                      ? 'Furniture'
                      : specKeys === 'vehicle'
                        ? 'Vehicle'
                        : 'Electronics'}
                    )
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {activeSpecFields.map((field) => (
                      <input
                        key={field.key}
                        value={form.specifications?.[field.key] || ''}
                        onChange={(e) =>
                          handleSpecChange(field.key, e.target.value)
                        }
                        placeholder={field.label}
                        className="border rounded-lg px-3 py-2"
                      />
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">
                      Product variants
                    </p>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="px-3 py-1.5 rounded-lg border text-xs text-gray-700 hover:bg-gray-50"
                    >
                      + Add Variant
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.variants.map((variant, index) => (
                      <div
                        key={variant._clientKey || `legacy-${index}`}
                        className="border rounded-xl p-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            value={variant.variantName}
                            onChange={(e) =>
                              updateVariant(
                                index,
                                'variantName',
                                e.target.value,
                              )
                            }
                            placeholder="Variant name"
                            className="border rounded-lg px-3 py-2"
                          />
                          <input
                            value={variant.color}
                            onChange={(e) =>
                              updateVariant(index, 'color', e.target.value)
                            }
                            placeholder="Color"
                            className="border rounded-lg px-3 py-2"
                          />
                          <input
                            value={variant.storage}
                            onChange={(e) =>
                              updateVariant(index, 'storage', e.target.value)
                            }
                            placeholder="Storage"
                            className="border rounded-lg px-3 py-2"
                          />
                          <input
                            value={variant.ram}
                            onChange={(e) =>
                              updateVariant(index, 'ram', e.target.value)
                            }
                            placeholder="RAM"
                            className="border rounded-lg px-3 py-2"
                          />
                          {form.type === 'Sell' ? (
                            <select
                              value={normalizeConditionForListingType(
                                variant.condition || form.condition,
                                'Sell',
                              )}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  'condition',
                                  e.target.value,
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                            >
                              {SELL_CONDITION_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={normalizeConditionForListingType(
                                variant.condition || form.condition,
                                'Rental',
                              )}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  'condition',
                                  e.target.value,
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                            >
                              {RENTAL_CONDITION_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}
                          <input
                            value={variant.price}
                            onChange={(e) =>
                              updateVariant(index, 'price', e.target.value)
                            }
                            placeholder="Variant price"
                            className="border rounded-lg px-3 py-2"
                          />
                          <input
                            value={variant.stock}
                            onChange={(e) =>
                              updateVariant(index, 'stock', e.target.value)
                            }
                            placeholder="Variant stock"
                            type="number"
                            className="border rounded-lg px-3 py-2"
                          />
                        </div>
                        {form.variants.length > 1 ? (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {form.type !== 'Sell' ? (
                  <div className="md:col-span-2 border-t pt-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      {form.type === 'Sell'
                        ? 'Rental configuration (optional)'
                        : 'Rental Configuration'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {form.rentalConfigurations.map((cfg, idx) => (
                        <div
                          key={`${cfg.months}-${idx}`}
                          className="border rounded-xl p-3"
                        >
                          <p className="text-xs text-gray-500 mb-2">
                            {cfg.months} Months
                          </p>
                          <input
                            type="text"
                            value={cfg.label}
                            onChange={(e) =>
                              updateRentalConfig(idx, 'label', e.target.value)
                            }
                            placeholder="Label"
                            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                          />
                          <input
                            type="number"
                            value={cfg.pricePerDay}
                            onChange={(e) =>
                              updateRentalConfig(
                                idx,
                                'pricePerDay',
                                e.target.value,
                              )
                            }
                            placeholder="Pricing per day"
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {form.type !== 'Sell' ? (
                  <div className="md:col-span-2 border-t pt-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Refundable Deposit
                    </p>
                    <input
                      type="number"
                      value={form.refundableDeposit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          refundableDeposit: e.target.value,
                        }))
                      }
                      placeholder="Enter refundable deposit amount"
                      className="w-full md:w-1/2 border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ) : null}
              </>
            )}

            {/* {form.type === 'Sell' ? (
              <div className="md:col-span-2 border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">
                    Sales Configuration
                  </p>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={
                      form.salesConfiguration?.allowVendorEditSalePrice !==
                      false
                    }
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        salesConfiguration: {
                          ...(prev.salesConfiguration || {}),
                          allowVendorEditSalePrice:
                            prev.salesConfiguration
                              ?.allowVendorEditSalePrice === false,
                        },
                      }))
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      form.salesConfiguration?.allowVendorEditSalePrice !==
                      false
                        ? 'bg-emerald-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                        form.salesConfiguration?.allowVendorEditSalePrice !==
                        false
                          ? 'translate-x-5'
                          : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={form.salesConfiguration?.salePrice || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        salesConfiguration: {
                          ...(prev.salesConfiguration || {}),
                          salePrice: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g., 54999"
                    // placeholder="Sell Price (Pay now)"
                    className="border rounded-lg px-3 py-2"
                  />
                  <input
                    type="number"
                    value={form.salesConfiguration?.mrpPrice || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        salesConfiguration: {
                          ...(prev.salesConfiguration || {}),
                          mrpPrice: e.target.value,
                        },
                      }))
                    }
                    placeholder="MRP (Optional)"
                    className="border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            ) : null} */}

            {form.type === 'Sell' ? (
              <div className="md:col-span-2 border-t pt-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Sales Configuration
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Set pricing and inventory details
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          Allow Vendors to Edit Prices
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            form.salesConfiguration
                              ?.allowVendorEditSalePrice !== false
                          }
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              salesConfiguration: {
                                ...(prev.salesConfiguration || {}),
                                allowVendorEditSalePrice:
                                  prev.salesConfiguration
                                    ?.allowVendorEditSalePrice === false,
                              },
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            form.salesConfiguration
                              ?.allowVendorEditSalePrice !== false
                              ? 'bg-emerald-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                              form.salesConfiguration
                                ?.allowVendorEditSalePrice !== false
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selling Price (₹){' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.salesConfiguration?.salePrice || ''}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              salesConfiguration: {
                                ...(prev.salesConfiguration || {}),
                                salePrice: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g., 54999"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          MRP (Optional) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.salesConfiguration?.mrpPrice || ''}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              salesConfiguration: {
                                ...(prev.salesConfiguration || {}),
                                mrpPrice: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g., 70000"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          Original price (for discount calculation)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* <div className="md:col-span-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Logistics & Verification
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={form.logisticsVerification?.inventoryOwnerName || ''}
                onChange={(e) =>
                  handleLogisticsChange('inventoryOwnerName', e.target.value)
                }
                placeholder="Inventory owner name"
                className="border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                value={form.logisticsVerification?.city || ''}
                onChange={(e) => handleLogisticsChange('city', e.target.value)}
                placeholder="City"
                className="border rounded-lg px-3 py-2"
              />
            </div>
          </div> */}

            <div className="md:col-span-2 flex flex-col gap-3 border-t border-gray-100 pt-4 mt-1 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 sm:w-auto"
              >
                <Save
                  className="h-4 w-4 shrink-0 text-gray-600"
                  strokeWidth={2}
                />
                Save as Draft
              </button>
              <div className="flex w-full justify-end gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border text-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className={submitPrimaryClassName}>
                  {mode === 'edit' ? submitEditLabel : submitCreateLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProductAddModal;
