'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Search,
  Tag,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { apiGetVendorMarketLowRentalTenures } from '@/service/api';

import {
  getCategories,
  getSubCategories,
} from '../../../redux/slices/categorySlice';

// ─── Spec fields by category (exact copy from AdminProductAddModal) ───────────
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

// ─── Rental tier presets (exact copy from AdminProductAddModal) ───────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function numOr(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const toNum = (v, fallback = 0) => {
  const s = String(v ?? '')
    .replace(/,/g, '')
    .trim();
  if (!s) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
};

const SELL_CONDITION_OPTIONS = ['Brand New', 'Refurbished'];
const RENTAL_MANUAL_CONDITION_OPTIONS = ['Brand New', 'Refurbished'];

function normalizeManualRentalCondition(condition) {
  const c = String(condition || '').trim();
  if (RENTAL_MANUAL_CONDITION_OPTIONS.includes(c)) return c;
  if (c === 'Like New') return 'Brand New';
  if (c === 'Good' || c === 'Fair') return 'Refurbished';
  return 'Brand New';
}

function normalizeConditionForListingType(condition, listingType) {
  const c = String(condition || '').trim();
  if (listingType === 'Sell') {
    return SELL_CONDITION_OPTIONS.includes(c) ? c : 'Brand New';
  }
  return normalizeManualRentalCondition(c);
}

function formatInrCompact(n) {
  if (!Number.isFinite(n) || n <= 0) return '';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

/** When form-level price is empty, derive label from first variant rental tiers */
function derivedPriceLabelFromVariantRentals(v0) {
  const configs = Array.isArray(v0?.rentalConfigurations)
    ? v0.rentalConfigurations
    : [];
  if (!configs.length) return '';
  const isDay = configs.some((c) => c?.periodUnit === 'day');
  const rent = (c) =>
    toNum(c?.customerRent ?? c?.vendorRent ?? c?.pricePerDay, 0);
  if (isDay) {
    const t =
      configs.find((c) => c?.periodUnit === 'day' && toNum(c?.days, 0) === 3) ||
      configs.find((c) => c?.periodUnit === 'day');
    if (!t) return '';
    const amt = rent(t);
    const d = toNum(t?.days, 3) || 3;
    const f = formatInrCompact(amt);
    if (!f) return '';
    return d === 3 ? `₹${f}/3d` : `₹${f}/${d}d`;
  }
  const t =
    configs.find((c) => c?.periodUnit !== 'day' && toNum(c?.months, 0) === 3) ||
    configs.find(
      (c) =>
        (c?.periodUnit === 'month' || !c?.periodUnit) &&
        toNum(c?.months, 0) > 0,
    ) ||
    configs.find((c) => toNum(c?.months, 0) > 0);
  if (!t) return '';
  const amt = rent(t);
  const m = toNum(t?.months, 3) || 3;
  const f = formatInrCompact(amt);
  if (!f) return '';
  return m === 3 ? `₹${f}/3mo` : `₹${f}/${m}mo`;
}

let _variantKeySeq = 0;
function newVariantClientKey() {
  // Deterministic key generator to avoid SSR/CSR hydration mismatches.
  _variantKeySeq += 1;
  return `vk-${_variantKeySeq}`;
}

// ─── Rental tier factories ────────────────────────────────────────────────────
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

// ─── Flexible variant factory ─────────────────────────────────────────────────
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

// ─── Image preview component ──────────────────────────────────────────────────
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

// ─── Standard catalog helpers ─────────────────────────────────────────────────
function standardProductThumbUrl(p) {
  return (
    p?.images?.[0] ||
    p?.image ||
    'https://placehold.co/56x56/e5e7eb/6b7280?text=IMG'
  );
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
      ? v.images.filter(Boolean).slice(0, 5)
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
    return product.images.filter(Boolean).slice(0, 5);
  }
  if (product?.image) return [product.image];
  return [];
}

// ─── Default form state ───────────────────────────────────────────────────────
const defaultForm = {
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
  variants: [],
  logisticsVerification: { inventoryOwnerName: '', city: '' },
  price: '',
  stock: '',
  salePrice: '',
  mrpPrice: '',
  status: 'Active',
  isActive: true,
  images: [],
  existingImages: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// VendorManualProductModal
// Exact same UI/structure as AdminProductAddModal (flexibleListingForm mode)
// while keeping VendorManualProductModal's own state and submit payload.
// ─────────────────────────────────────────────────────────────────────────────
export default function VendorManualProductModal({
  isOpen,
  onClose,
  onSubmit,
  existingProducts = [],
  standardCatalogLoading = false,
  fetchStandardListingTemplate = null,
  standardSearchPlaceholder = 'Search standard listed products',
  enableStandardProductSearch = true,
  /** 'rental' | 'sell' — sell uses Brand New / Refurbished only and sales payload */
  listingKind = 'rental',
}) {
  const dispatch = useDispatch();
  const { categories, subCategories } = useSelector((s) => s.category);

  // ── core form state ─────────────────────────────────────────────────────────
  const [form, setForm] = useState({ ...defaultForm });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // ── catalog search state ────────────────────────────────────────────────────
  const [standardSearch, setStandardSearch] = useState('');
  const [standardCategoryFilter, setStandardCategoryFilter] = useState('all');
  const [standardFilterOpen, setStandardFilterOpen] = useState(false);
  const [templateApplyLoadingId, setTemplateApplyLoadingId] = useState(null);

  // ── vendor-specific logistics extras ───────────────────────────────────────
  const [deliveryTimelineValue, setDeliveryTimelineValue] = useState('');
  const [deliveryTimelineUnit, setDeliveryTimelineUnit] = useState('Days');
  const [marketLowTenures, setMarketLowTenures] = useState({
    month: {},
    day: {},
  });
  const [marketLowLoading, setMarketLowLoading] = useState(false);

  const filteredCategories = useMemo(() => {
    const isSell = listingKind === 'sell';
    return (categories || []).filter((c) =>
      isSell ? c.availableInBuy : c.availableInRent,
    );
  }, [categories, listingKind]);

  const filteredSubCategories = useMemo(() => {
    const isSell = listingKind === 'sell';
    return (subCategories || []).filter((s) =>
      isSell ? s.availableInBuy : s.availableInRent,
    );
  }, [subCategories, listingKind]);

  // ── reset on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    dispatch(getCategories());
    const isSell = listingKind === 'sell';
    setForm({
      ...defaultForm,
      type: isSell ? 'Sell' : 'Rental',
      condition: 'Brand New',
    });
    setSelectedCategoryId('');
    setStandardSearch('');
    setStandardCategoryFilter('all');
    setStandardFilterOpen(false);
    setDeliveryTimelineValue('');
    setDeliveryTimelineUnit('Days');
    setMarketLowTenures({ month: {}, day: {} });
    setMarketLowLoading(false);
  }, [isOpen, dispatch, listingKind]);

  useEffect(() => {
    if (!isOpen || listingKind === 'sell') return undefined;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null;
    const cat = String(form.category || '').trim();
    const sub = String(form.subCategory || '').trim();
    if (!token || !cat || !sub) {
      setMarketLowTenures({ month: {}, day: {} });
      return undefined;
    }
    let cancelled = false;
    setMarketLowLoading(true);
    apiGetVendorMarketLowRentalTenures(
      { category: cat, subCategory: sub },
      token,
    )
      .then((res) => {
        if (cancelled) return;
        const m = res?.data?.month || {};
        const d = res?.data?.day || {};
        setMarketLowTenures({ month: m, day: d });
      })
      .catch(() => {
        if (!cancelled) setMarketLowTenures({ month: {}, day: {} });
      })
      .finally(() => {
        if (!cancelled) setMarketLowLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, form.category, form.subCategory, listingKind]);

  // ── sync category select when form.category changes (template apply) ────────
  useEffect(() => {
    if (!isOpen || !String(form.category || '').trim() || !categories.length)
      return;
    const matched = categories.find((c) => c.name === form.category);
    if (!matched) return;
    if (selectedCategoryId === matched._id) return;
    setSelectedCategoryId(matched._id);
    dispatch(getSubCategories(matched._id));
  }, [isOpen, form.category, categories, selectedCategoryId, dispatch]);

  // ── derived values ──────────────────────────────────────────────────────────
  const categoryKey = useMemo(() => {
    const k = String(form.category || '').toLowerCase();
    if (k.includes('furniture')) return 'furniture';
    if (k.includes('vehicle') || k.includes('car')) return 'vehicle';
    return 'electronics';
  }, [form.category]);

  const activeSpecFields = SPEC_FIELDS_BY_CATEGORY[categoryKey] || [];
  const specLabel =
    categoryKey === 'furniture'
      ? 'Furniture'
      : categoryKey === 'vehicle'
        ? 'Vehicle'
        : 'Electronics';

  // ── catalog derived ─────────────────────────────────────────────────────────
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
      .filter((p) => p?._id)
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
  }, [existingProducts, standardSearch, standardCategoryFilter]);

  // ── generic field handler ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      setForm((prev) => {
        const remainingSlots = Math.max(
          0,
          5 - (prev.existingImages?.length || 0) - prev.images.length,
        );
        const selected = Array.from(files || []).slice(0, remainingSlots);
        return { ...prev, images: [...prev.images, ...selected] };
      });
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── category handlers ───────────────────────────────────────────────────────
  const handleCategoryChange = (e) => {
    const id = e.target.value;
    setSelectedCategoryId(id);
    const cat = categories.find((c) => c._id === id);
    setForm((prev) => ({
      ...prev,
      category: cat?.name || '',
      subCategory: '',
      specifications: {},
      productCustomSpecs: [{ label: '', value: '' }],
    }));
    if (id) dispatch(getSubCategories(id));
  };

  const handleSubCategoryChange = (e) => {
    const id = e.target.value;
    const sub = subCategories.find((s) => s._id === id);
    setForm((prev) => ({ ...prev, subCategory: sub?.name || '' }));
  };

  // ── spec handler ────────────────────────────────────────────────────────────
  const handleSpecChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      specifications: { ...(prev.specifications || {}), [field]: value },
    }));
  };

  // ── variant management ──────────────────────────────────────────────────────
  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, emptyFlexibleVariant()],
    }));
  };

  const removeVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
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

  // ── variant spec rows ───────────────────────────────────────────────────────
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

  // ── variant rental config ───────────────────────────────────────────────────
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

  // ── variant images ──────────────────────────────────────────────────────────
  const onVariantFiles = (vIdx, e) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    e.target.value = '';
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? { ...v, images: [...(v.images || []), ...selected].slice(0, 5) }
          : v,
      ),
    }));
  };

  const removeVariantNewImage = (vIdx, imgIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? { ...v, images: (v.images || []).filter((_, j) => j !== imgIdx) }
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

  // ── catalog row handler ─────────────────────────────────────────────────────
  const addVariantFromProduct = (product) => {
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
  };

  const handleStandardCatalogRowAdd = async (p) => {
    if (fetchStandardListingTemplate) {
      setTemplateApplyLoadingId(p._id);
      try {
        const template = await fetchStandardListingTemplate(p._id);
        if (!template) {
          toast.error('Could not load listing template.');
          return;
        }
        const productCustomSpecs =
          Array.isArray(template.productCustomSpecs) &&
          template.productCustomSpecs.length
            ? template.productCustomSpecs.map((r) => ({
                label: r.label || '',
                value: r.value || '',
              }))
            : [{ label: '', value: '' }];
        const variants =
          Array.isArray(template.variants) && template.variants.length
            ? template.variants.map(mapVariantFromApi)
            : [];
        setForm((prev) => ({
          ...prev,
          productName: template.productName || prev.productName,
          category: template.category || prev.category,
          subCategory: template.subCategory || prev.subCategory,
          brand: template.brand || prev.brand,
          condition:
            listingKind === 'rental'
              ? normalizeManualRentalCondition(
                  template.condition || prev.condition,
                )
              : template.condition || prev.condition,
          shortDescription: template.shortDescription || prev.shortDescription,
          description: template.description || prev.description,
          specifications: template.specifications || {},
          productCustomSpecs,
          variants,
          existingImages: existingImagesFromStandardProduct(template),
        }));
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
    addVariantFromProduct(p);
  };

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

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
    if (!hasVariantImg) {
      toast.error('Add at least one image on a variant.');
      return;
    }
    if (!String(form.productName || '').trim()) {
      toast.error('Product name is required.');
      return;
    }
    if (!form.category || !form.subCategory) {
      toast.error('Category and sub-category are required.');
      return;
    }
    if (!String(deliveryTimelineValue || '').trim()) {
      toast.error('Delivery timeline is required.');
      return;
    }
    if (!String(form.stock || '').trim()) {
      toast.error('Inventory count is required.');
      return;
    }

    const variants = Array.isArray(form.variants) ? form.variants : [];
    const v0 = variants[0] || {};

    const trimmedPrice = String(form.price ?? '').trim();
    const anyVariantPrice = variants
      .map((v) => String(v?.price ?? '').trim())
      .find((pr) => pr.length > 0);
    const fromRental = derivedPriceLabelFromVariantRentals(v0);
    const derivedPrice =
      trimmedPrice !== '' ? trimmedPrice : anyVariantPrice || fromRental || '0';

    const sumVariantStock = variants.reduce(
      (a, v) => a + (Number(v.stock) || 0),
      0,
    );
    const firstVariantStock = Number(variants[0]?.stock) || 0;
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

    // Backend requires product-level images/existingImages.
    const images = [];
    const existingImages = [];
    for (const v of variants) {
      if (Array.isArray(v?.images)) {
        for (const f of v.images) if (f) images.push(f);
      }
      if (Array.isArray(v?.existingVariantImages)) {
        for (const u of v.existingVariantImages) if (u) existingImages.push(u);
      }
    }

    const up = (x) => String(x ?? '').trim();
    const isColorLabel = (label) => {
      const k = up(label).toLowerCase();
      return (
        k === 'color' ||
        k === 'colour' ||
        k.includes('color') ||
        k.includes('colour')
      );
    };
    const isStorageLabel = (label) => {
      const k = up(label).toLowerCase();
      return (
        k === 'storage' ||
        k.includes('storage') ||
        k.includes('capacity') ||
        k.includes('ssd') ||
        k.includes('hdd')
      );
    };
    const isRamLabel = (label) => {
      const k = up(label).toLowerCase();
      return k === 'ram' || k.includes('ram') || k.includes('memory');
    };

    const extractColorStorageRamFromSpecRows = (specRows) => {
      let color = '';
      let storage = '';
      let ram = '';
      const rows = Array.isArray(specRows) ? specRows : [];
      for (const row of rows) {
        const label = up(row?.label);
        const value = up(row?.value);
        if (!label || !value) continue;
        if (isColorLabel(label)) color = value;
        else if (isStorageLabel(label)) storage = value;
        else if (isRamLabel(label)) ram = value;
      }
      return { color, storage, ram };
    };

    // Build product.specifications from variant spec rows (but omit color/storage/ram
    // so storefront can render them via product.variants[0].color/storage/ram).
    const specMap = {};
    const v0SpecRows = Array.isArray(v0?.specRows) ? v0.specRows : [];
    for (const row of v0SpecRows) {
      const label = up(row?.label);
      const value = up(row?.value);
      if (!label || !value) continue;
      if (isColorLabel(label) || isStorageLabel(label) || isRamLabel(label)) {
        continue;
      }
      specMap[label] = value;
    }

    const sellCond = normalizeConditionForListingType(form.condition, 'Sell');
    const rentCond = normalizeConditionForListingType(form.condition, 'Rental');

    if (listingKind === 'sell') {
      const sp = toNum(form.salePrice, 0);
      const anyVp = variants.some((v) => String(v?.price ?? '').trim() !== '');
      if (!sp && !anyVp) {
        toast.error('Enter sale price (product-level or on a variant).');
        return;
      }
      const variantsPayloadSell = variants
        .filter((v) => up(v?.variantName))
        .map((v) => {
          const { color, storage, ram } = extractColorStorageRamFromSpecRows(
            v?.specRows,
          );
          return {
            variantName: up(v?.variantName),
            color,
            storage,
            ram,
            condition: sellCond,
            price: up(v?.price || form.salePrice),
            stock: toNum(v?.stock, 0),
          };
        });
      const saleLabel =
        String(form.salePrice ?? '').trim() !== ''
          ? String(form.salePrice).trim()
          : up(v0?.price) || String(sp || '');
      const payloadSell = {
        productName: up(form.productName),
        type: 'Sell',
        category: up(form.category),
        subCategory: up(form.subCategory),
        brand: up(form.brand),
        condition: sellCond,
        shortDescription: up(form.shortDescription),
        description: up(form.description),
        specifications: {
          ...(form.specifications && typeof form.specifications === 'object'
            ? form.specifications
            : {}),
          ...specMap,
        },
        variants: variantsPayloadSell,
        rentalConfigurations: [],
        refundableDeposit: 0,
        salesConfiguration: {
          allowVendorEditSalePrice: true,
          salePrice: toNum(form.salePrice, toNum(v0?.price, 0)),
          mrpPrice: toNum(form.mrpPrice, 0),
        },
        logisticsVerification: {
          inventoryOwnerName: up(form.logisticsVerification?.inventoryOwnerName),
          city: up(form.logisticsVerification?.city),
          deliveryTimelineValue: toNum(deliveryTimelineValue, 0),
          deliveryTimelineUnit,
        },
        existingImages: existingImages.slice(0, 5),
        images: images.slice(0, 5),
        price: saleLabel,
        stock: toNum(derivedStock, 0),
        status: 'Active',
        submissionStatus: 'pending_approval',
        createdVia: 'manual',
        allowVendorEditRentalPrices: true,
      };
      const ok = await onSubmit?.(payloadSell);
      if (ok) onClose?.();
      return;
    }

    const variantsPayload = variants
      .filter((v) => up(v?.variantName))
      .map((v) => {
        const { color, storage, ram } = extractColorStorageRamFromSpecRows(
          v?.specRows,
        );
        return {
          variantName: up(v?.variantName),
          color,
          storage,
          ram,
          condition: rentCond,
          price: up(v?.price),
          stock: toNum(v?.stock, 0),
        };
      });

    const rentalSource = Array.isArray(v0?.rentalConfigurations)
      ? v0.rentalConfigurations
      : [];
    const rentalConfigurations = rentalSource.map((cfg) => {
      const periodUnit = cfg?.periodUnit === 'day' ? 'day' : 'month';
      const months = toNum(cfg?.months, periodUnit === 'month' ? 0 : 0);
      const days = toNum(cfg?.days, periodUnit === 'day' ? 0 : 0);

      const rentRaw =
        cfg?.customerRent != null && up(cfg?.customerRent) !== ''
          ? cfg.customerRent
          : cfg?.vendorRent != null && up(cfg?.vendorRent) !== ''
            ? cfg.vendorRent
            : cfg?.pricePerDay != null && up(cfg?.pricePerDay) !== ''
              ? cfg.pricePerDay
              : 0;
      const rent = toNum(rentRaw, 0);

      return {
        months,
        days,
        periodUnit,
        label: up(cfg?.label),
        pricePerDay: rent,
        customerRent: rent,
        shippingCharges: 0,
      };
    });

    const refundableDeposit = toNum(v0?.refundableDeposit, 0);

    const payload = {
      productName: up(form.productName),
      type: 'Rental',
      category: up(form.category),
      subCategory: up(form.subCategory),
      brand: up(form.brand),
      condition: rentCond,
      shortDescription: up(form.shortDescription),
      description: up(form.description),
      specifications: {
        ...(form.specifications && typeof form.specifications === 'object'
          ? form.specifications
          : {}),
        ...specMap,
      },
      variants: variantsPayload,
      rentalConfigurations,
      refundableDeposit,
      logisticsVerification: {
        inventoryOwnerName: up(form.logisticsVerification?.inventoryOwnerName),
        city: up(form.logisticsVerification?.city),
        deliveryTimelineValue: toNum(deliveryTimelineValue, 0),
        deliveryTimelineUnit,
      },
      existingImages: existingImages.slice(0, 5),
      images: images.slice(0, 5),
      price: derivedPrice,
      stock: toNum(derivedStock, 0),
      status: 'Active',
      submissionStatus: 'pending_approval',
      createdVia: 'manual',
      allowVendorEditRentalPrices: true,
    };

    const ok = await onSubmit?.(payload);
    if (ok) onClose?.();
  };

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {listingKind === 'sell' ? 'Add sell listing' : 'Add new listing'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {listingKind === 'sell'
                ? 'Manual sell product — condition and pricing below'
                : 'List your product, rental, or service'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* ── Listing type row ── */}
          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <div
              className={`rounded-xl border text-center py-2 text-sm font-medium ${
                listingKind === 'rental'
                  ? 'border-orange-300 text-orange-600 bg-orange-50'
                  : 'border-gray-200 text-gray-400 bg-gray-50'
              }`}
            >
              Add Rental
            </div>
            <div
              className={`rounded-xl border text-center py-2 text-sm font-medium ${
                listingKind === 'sell'
                  ? 'border-blue-500 text-blue-800 bg-blue-50'
                  : 'border-gray-200 text-gray-400 bg-gray-50'
              }`}
            >
              Sell product
            </div>
          </div>

          {/* ── Standard catalog search panel ── */}
          {/* {enableStandardProductSearch ? (
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/70">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Tag className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">
                      Search Standard Listed Products
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pick an admin template and tap Add to fill the form — then
                      save as your vendor listing
                    </p>
                  </div>
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
                    {(existingProducts || []).filter((p) => p?._id).length === 0
                      ? 'No listed products available. Create standard products first, or add variants manually below.'
                      : 'No products match your search or filter.'}
                  </p>
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
                            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
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
          ) : null} */}

          {/* ── Basic Information ── */}
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Basic Information
            </p>
          </div>

          <input
            name="productName"
            value={form.productName}
            onChange={handleChange}
            placeholder="Product name"
            className="border rounded-lg px-3 py-2"
            required
          />

          <div className="border rounded-lg px-3 py-2 bg-gray-50 text-sm text-gray-600">
            Listing Type:{' '}
            <span className="font-medium text-gray-900">
              {listingKind === 'sell' ? 'Sell' : 'Rental'}
            </span>
          </div>

          <input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            placeholder="Brand"
            className="border rounded-lg px-3 py-2"
          />

          <select
            name="condition"
            value={normalizeConditionForListingType(
              form.condition,
              listingKind === 'sell' ? 'Sell' : 'Rental',
            )}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            {(listingKind === 'sell'
              ? SELL_CONDITION_OPTIONS
              : RENTAL_MANUAL_CONDITION_OPTIONS
            ).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            name="category"
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select category</option>
            {filteredCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sub-category */}
          <select
            name="subCategory"
            value={
              filteredSubCategories.find((s) => s.name === form.subCategory)
                ?._id || ''
            }
            onChange={handleSubCategoryChange}
            className="border rounded-lg px-3 py-2"
            disabled={!selectedCategoryId}
          >
            <option value="">Select subcategory</option>
            {filteredSubCategories.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* <input
            name="shortDescription"
            value={form.shortDescription}
            onChange={handleChange}
            placeholder="Short description"
            className="border rounded-lg px-3 py-2 md:col-span-2"
          /> */}

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Detailed description"
            className="border rounded-lg px-3 py-2 md:col-span-2 min-h-[90px]"
          />

          {listingKind === 'sell' ? (
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Sale price <span className="text-red-500">*</span>
                </label>
                <input
                  name="salePrice"
                  value={form.salePrice}
                  onChange={handleChange}
                  placeholder="e.g. 24999"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  MRP (optional)
                </label>
                <input
                  name="mrpPrice"
                  value={form.mrpPrice}
                  onChange={handleChange}
                  placeholder="e.g. 29999"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : null}

          {/* ── Product Specifications ── */}
          {/* <div className="md:col-span-2 border-t pt-4 mt-1">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Product Specifications ({specLabel})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeSpecFields.map((field) => (
                <input
                  key={field.key}
                  value={form.specifications?.[field.key] || ''}
                  onChange={(e) => handleSpecChange(field.key, e.target.value)}
                  placeholder={field.label}
                  className="border rounded-lg px-3 py-2"
                />
              ))}
            </div>
          </div> */}

          {/* ── Product Variants (flexible listing form) ── */}
          <div className="md:col-span-2 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">
                Product variants
              </p>
              <button
                type="button"
                onClick={addVariant}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100"
              >
                + Add variant
              </button>
            </div>

            <div className="space-y-4">
              {form.variants.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 flex flex-col items-center justify-center gap-2 text-sm text-gray-400">
                  <p>No variants added yet</p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700"
                  >
                    + Add first variant
                  </button>
                </div>
              ) : null}

              {form.variants.map((variant, index) => (
                <div
                  key={variant._clientKey || `flex-${index}`}
                  className="rounded-xl border border-gray-200 bg-white p-4 space-y-4 shadow-sm"
                >
                  {/* Variant header */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">
                      Variant {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove variant
                    </button>
                  </div>

                  {/* Variant name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={variant.variantName || ''}
                      onChange={(e) =>
                        updateVariant(index, 'variantName', e.target.value)
                      }
                      placeholder="Variant name (e.g. 256GB Gold)"
                      className="border rounded-lg px-3 py-2 md:col-span-3"
                    />
                  </div>

                  {/* Product media */}
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Product media
                    </p>
                    {(variant.existingVariantImages || []).length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-2">
                        {(variant.existingVariantImages || []).map(
                          (src, vi) => (
                            <div
                              key={`ve-${vi}`}
                              className="relative h-20 rounded-lg border overflow-hidden"
                            >
                              <img
                                src={src}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeVariantExistingImage(index, vi)
                                }
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onVariantFiles(index, e)}
                      className="w-full text-sm border rounded-lg px-3 py-2"
                    />
                    {(variant.images || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(variant.images || []).map((file, fi) => (
                          <div
                            key={fi}
                            className="relative border rounded-lg p-1"
                          >
                            <VariantNewImagePreview file={file} />
                            <button
                              type="button"
                              onClick={() => removeVariantNewImage(index, fi)}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Variant specifications */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        Variant specifications
                      </p>
                      <button
                        type="button"
                        onClick={() => addVariantSpecRow(index)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700"
                      >
                        + Add custom specification
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(variant.specRows || [{ label: '', value: '' }]).map(
                        (row, ri) => (
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
                              placeholder="Label"
                              className="flex-1 min-w-[100px] border rounded-lg px-3 py-2 text-sm"
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
                              placeholder="Value"
                              className="flex-1 min-w-[100px] border rounded-lg px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantSpecRow(index, ri)}
                              className="px-2 py-1 text-red-600 text-sm"
                            >
                              ×
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {listingKind === 'sell' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Variant sale price
                        </p>
                        <input
                          value={variant.price || ''}
                          onChange={(e) =>
                            updateVariant(index, 'price', e.target.value)
                          }
                          placeholder="If empty, uses product sale price above"
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Variant stock
                        </p>
                        <input
                          type="number"
                          min={0}
                          value={variant.stock ?? ''}
                          onChange={(e) =>
                            updateVariant(index, 'stock', e.target.value)
                          }
                          placeholder="Units"
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Rental configuration card */}
                  {listingKind !== 'sell' ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4 space-y-4">
                    {/* Card header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <DollarSign className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Rental configuration
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Set competitive rental prices for different tenure
                            options. Market low shows the best rate among other
                            vendors in this category (you’re excluded).
                          </p>
                        </div>
                      </div>
                      {/* Allow vendor edit toggle */}
                      {/* <div className="flex items-center gap-2 sm:shrink-0">
                        <span className="text-xs text-gray-600 max-w-[9rem] sm:max-w-none leading-tight">
                          Allow vendors to edit prices
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            variant.allowVendorEditRentalPrices !== false
                          }
                          onClick={() =>
                            updateVariant(
                              index,
                              'allowVendorEditRentalPrices',
                              !(variant.allowVendorEditRentalPrices !== false),
                            )
                          }
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            variant.allowVendorEditRentalPrices !== false
                              ? 'bg-emerald-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                              variant.allowVendorEditRentalPrices !== false
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div> */}
                    </div>

                    {/* Pricing model toggle + Add term button */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setVariantRentalPricingModel(index, 'month')
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

                    {/* Tenure cards: market low + your price + match */}
                    {(() => {
                      const rentField = 'customerRent';
                      return (
                        <div>
                          {!String(form.category || '').trim() ||
                          !String(form.subCategory || '').trim() ? (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                              Select category and sub-category above to load
                              market-low benchmarks for each term.
                            </p>
                          ) : null}
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {(variant.rentalConfigurations || []).map(
                              (cfg, cidx) => {
                                const isDayModel =
                                  variant.rentalPricingModel === 'day';
                                const tenureLen = isDayModel
                                  ? numOr(cfg.days, 0)
                                  : numOr(cfg.months, 0);
                                const lowMap = isDayModel
                                  ? marketLowTenures.day
                                  : marketLowTenures.month;
                                const perUnit =
                                  tenureLen > 0
                                    ? (lowMap?.[tenureLen] ??
                                      lowMap?.[String(tenureLen)])
                                    : undefined;
                                const hasLow =
                                  perUnit != null &&
                                  Number.isFinite(Number(perUnit)) &&
                                  Number(perUnit) > 0;
                                const marketLine = marketLowLoading
                                  ? 'Loading…'
                                  : hasLow
                                    ? isDayModel
                                      ? `₹${formatInrCompact(Number(perUnit))}/day`
                                      : `₹${formatInrCompact(Number(perUnit))}/mo`
                                    : '—';
                                const onMatchLowest = () => {
                                  if (!hasLow || tenureLen <= 0) return;
                                  const total = Math.round(
                                    Number(perUnit) * tenureLen,
                                  );
                                  updateVariantRentalConfig(
                                    index,
                                    cidx,
                                    rentField,
                                    String(total),
                                  );
                                };
                                const showPopular =
                                  !isDayModel && numOr(cfg.months, 0) === 12;

                                return (
                                  <div
                                    key={`rental-${cidx}`}
                                    className="relative rounded-xl border border-amber-200/90 bg-white p-3 shadow-sm space-y-2.5"
                                  >
                                    {showPopular ? (
                                      <span className="absolute top-2 right-2 rounded-full bg-orange-500 text-[9px] font-bold text-white px-2 py-0.5">
                                        POPULAR
                                      </span>
                                    ) : null}
                                    <div className="flex items-start justify-between gap-1 pr-14">
                                      <div className="min-w-0 flex-1 space-y-1">
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
                                          className="w-full text-[10px] font-semibold tracking-wide text-gray-400 uppercase border border-gray-200 rounded-lg px-2 py-1"
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
                                            isDayModel ? '3 Days' : '3 Months'
                                          }
                                          className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2 py-1"
                                        />
                                      </div>
                                      {(variant.rentalConfigurations || [])
                                        .length > 1 ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeVariantRentalTerm(index, cidx)
                                          }
                                          className="shrink-0 text-gray-400 hover:text-red-600 text-sm px-1"
                                          aria-label="Remove term"
                                        >
                                          ×
                                        </button>
                                      ) : null}
                                    </div>

                                    <div className="rounded-lg bg-emerald-50/80 border border-emerald-100 px-2.5 py-2">
                                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                        <TrendingDown
                                          className="h-3.5 w-3.5 shrink-0"
                                          strokeWidth={2.5}
                                        />
                                        Market low
                                      </div>
                                      <p className="text-sm font-semibold text-emerald-700 tabular-nums mt-0.5">
                                        {marketLine}
                                      </p>
                                      <p className="text-[10px] text-emerald-600/90 mt-0.5">
                                        {isDayModel
                                          ? 'Lowest per-day rate for this tenure'
                                          : 'Lowest per-month rate for this tenure'}
                                      </p>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                        Your price
                                      </label>
                                      {/* <p className="text-[10px] text-gray-500 mb-1">
                                        Total rent for this term (same basis as
                                        storefront)
                                      </p> */}
                                      <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20">
                                        <span className="flex items-center px-2.5 text-gray-500 text-sm bg-gray-50 border-r border-gray-200">
                                          ₹
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          value={cfg[rentField] ?? ''}
                                          onChange={(e) =>
                                            updateVariantRentalConfig(
                                              index,
                                              cidx,
                                              rentField,
                                              e.target.value,
                                            )
                                          }
                                          placeholder="0"
                                          className="min-w-0 flex-1 border-0 px-2 py-2 text-sm outline-none"
                                        />
                                      </div>
                                      {/* <p className="text-[10px] text-gray-400 mt-1">
                                        {isDayModel
                                          ? `For ${tenureLen || '—'} day block`
                                          : `For ${tenureLen || '—'} month block`}
                                      </p> */}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={onMatchLowest}
                                      disabled={!hasLow || tenureLen <= 0}
                                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-45 disabled:cursor-not-allowed"
                                    >
                                      <Zap className="h-3.5 w-3.5" />
                                      Match lowest
                                    </button>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  ) : null}

                  {/* Refundable deposit per-variant */}
                  {listingKind !== 'sell' ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Refundable deposit
                    </p>
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
                      placeholder="Amount"
                      className="w-full md:w-1/2 border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* ── Logistics & Verification ── */}
          <div className="md:col-span-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Logistics &amp; Verification
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Delivery timeline (vendor-specific) */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Delivery timeline <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <input
                    value={deliveryTimelineValue}
                    onChange={(e) => setDeliveryTimelineValue(e.target.value)}
                    placeholder="e.g. 3"
                    className="flex-1 min-w-0 px-3 py-2 text-sm outline-none border-0"
                  />
                  <select
                    value={deliveryTimelineUnit}
                    onChange={(e) => setDeliveryTimelineUnit(e.target.value)}
                    className="border-l border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="Days">Days</option>
                    <option value="Hours">Hours</option>
                  </select>
                </div>
              </div>

              {/* Inventory count (vendor-specific) */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Inventory count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="Units available"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Inventory owner name */}
              {/* <input
                type="text"
                value={form.logisticsVerification?.inventoryOwnerName || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    logisticsVerification: {
                      ...(prev.logisticsVerification || {}),
                      inventoryOwnerName: e.target.value,
                    },
                  }))
                }
                placeholder="Inventory owner name"
                className="border rounded-lg px-3 py-2"
              /> */}

              {/* City */}
              {/* <input
                type="text"
                value={form.logisticsVerification?.city || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    logisticsVerification: {
                      ...(prev.logisticsVerification || {}),
                      city: e.target.value,
                    },
                  }))
                }
                placeholder="City"
                className="border rounded-lg px-3 py-2"
              /> */}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            >
              Submit for approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
