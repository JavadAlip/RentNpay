'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Calendar, Clock, DollarSign, Filter, Search, Tag } from 'lucide-react';
import {
  getCategories,
  getSubCategories,
} from '../../../redux/slices/categorySlice';

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
    return product.images.filter(Boolean).slice(0, 5);
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

const defaultForm = {
  sku: '',
  productName: '',
  type: 'Rental',
  category: '',
  subCategory: '',
  brand: '',
  condition: 'Good',
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
};

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

  const variantsFromTemplate =
    Array.isArray(template.variants) && template.variants.length
      ? template.variants.map((v) => ({
          _clientKey: newVariantClientKey(),
          variantName: v.variantName || '',
          color: v.color || '',
          storage: v.storage || '',
          ram: v.ram || '',
          condition: v.condition || template.condition || '',
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
            condition: template.condition || '',
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
    type: template.type || 'Rental',
    category: template.category || '',
    subCategory: template.subCategory || '',
    brand: template.brand || '',
    condition: template.condition || 'Good',
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
        return v0.images.filter(Boolean).slice(0, 5);
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
  flexibleListingForm = false,
}) => {
  const dispatch = useDispatch();
  const { categories, subCategories } = useSelector((state) => state.category);

  const [form, setForm] = useState({ ...defaultForm });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [standardSearch, setStandardSearch] = useState('');
  const [standardCategoryFilter, setStandardCategoryFilter] = useState('all');
  const [standardFilterOpen, setStandardFilterOpen] = useState(false);
  const [templateApplyLoadingId, setTemplateApplyLoadingId] = useState(null);

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

        setForm({
          ...defaultForm,
          sku: initialData.sku || '',
          productName: initialData.productName || '',
          type: initialData.type || 'Rental',
          category: initialData.category || '',
          subCategory: initialData.subCategory || '',
          brand: initialData.brand || '',
          condition: initialData.condition || 'Good',
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
            ? initialData.images.filter(Boolean).slice(0, 5)
            : initialData.image
              ? [initialData.image]
              : [],
        });
      } else {
        setForm({
          sku: initialData.sku || '',
          productName: initialData.productName || '',
          type: initialData.type || 'Rental',
          category: initialData.category || '',
          subCategory: initialData.subCategory || '',
          brand: initialData.brand || '',
          condition: initialData.condition || 'Good',
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
                  condition: v.condition || '',
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
            ? initialData.images.filter(Boolean).slice(0, 5)
            : initialData.image
              ? [initialData.image]
              : [],
        });
      }
    } else if (flexibleListingForm) {
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
  }, [isOpen, initialData, dispatch, flexibleListingForm]);

  useEffect(() => {
    if (!isOpen) return;
    setStandardSearch('');
    setStandardCategoryFilter('all');
    setStandardFilterOpen(false);
  }, [isOpen]);

  // When categories are loaded and we are editing, map category name -> id and load subcategories
  useEffect(() => {
    if (!isOpen || !initialData || !categories.length) return;

    const matched = categories.find((c) => c.name === initialData.category);
    if (matched) {
      setSelectedCategoryId(matched._id);
      dispatch(getSubCategories(matched._id));
    }
  }, [isOpen, initialData, categories, dispatch]);

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
          5 - (prev.existingImages?.length || 0) - prev.images.length,
        );
        const selected = Array.from(files || []).slice(0, remainingSlots);
        return { ...prev, images: [...prev.images, ...selected] };
      });
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const id = e.target.value;
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

  const handleSubCategoryChange = (e) => {
    const id = e.target.value;
    const sub = subCategories.find((s) => s._id === id);
    const subName = sub?.name || '';

    setForm((prev) => ({
      ...prev,
      subCategory: subName,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

      onSubmit?.({ ...form, price: derivedPrice, stock: derivedStock });
      return;
    }
    onSubmit?.(form);
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

  const onVariantFiles = (vIdx, e) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    e.target.value = '';
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              images: [...(v.images || []), ...selected].slice(0, 5),
            }
          : v,
      ),
    }));
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
        toast.success('Template loaded — adjust details and save your listing.');
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
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
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
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Listing type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="Rental">Rental</option>
                    {/* <option value="Sell">Sell</option> */}
                  </select>
                </div>
              </>
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

          {enableStandardProductSearch ? (
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
                      {standardCatalogTableOnly
                        ? 'Same templates as on the Custom Listings page — search and filter below'
                        : standardCatalogPopulateFullForm
                          ? 'Pick an admin template and tap Add to fill the form — then save as your vendor listing'
                          : 'Add multiple product variants'}
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
                            {templateApplyLoadingId === p._id
                              ? '…'
                              : 'Add'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

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

          {!allowListingTypeSwitch ? (
            <div className="border rounded-lg px-3 py-2 bg-gray-50 text-sm text-gray-600">
              Listing Type:{' '}
              <span className="font-medium text-gray-900">Rental</span>
            </div>
          ) : null}
          <input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            placeholder="Brand"
            className="border rounded-lg px-3 py-2"
          />
          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option>Brand New</option>
            <option>Like New</option>
            <option>Good</option>
            <option>Fair</option>
          </select>
          {/* Category (dynamic) */}
          <select
            name="category"
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subcategory (depends on category) */}
          <select
            name="subCategory"
            value={
              subCategories.find((s) => s.name === form.subCategory)?._id || ''
            }
            onChange={handleSubCategoryChange}
            className="border rounded-lg px-3 py-2"
            disabled={!selectedCategoryId}
          >
            <option value="">Select subcategory</option>
            {subCategories.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Detailed description"
            className="border rounded-lg px-3 py-2 md:col-span-2 min-h-[90px]"
          />

          {flexibleListingForm ? (
            <>
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
                  {form.variants.map((variant, index) => (
                    <div
                      key={variant._clientKey || `flex-${index}`}
                      className="rounded-xl border border-gray-200 bg-white p-4 space-y-4 shadow-sm"
                    >
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
                                  onClick={() =>
                                    removeVariantNewImage(index, fi)
                                  }
                                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

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
                                  onClick={() =>
                                    removeVariantSpecRow(index, ri)
                                  }
                                  className="px-2 py-1 text-red-600 text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                              <DollarSign className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {form.type === 'Sell'
                                  ? 'Rental configuration (optional)'
                                  : 'Rental configuration'}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Customer &amp; vendor pricing by term
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
                                variant.allowVendorEditRentalPrices !== false
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
                          </div>
                        </div>

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

                        {['Customer configuration', 'Vendor configuration'].map(
                          (sectionTitle) => {
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
                                      <div
                                        key={`${sectionTitle}-${cidx}`}
                                        className="rounded-xl border border-amber-200/90 bg-white p-3 shadow-sm space-y-2"
                                      >
                                        <div className="flex items-start justify-between gap-1">
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
                                                variant.rentalPricingModel ===
                                                'day'
                                                  ? '3 Days'
                                                  : '3 Months'
                                              }
                                              className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2 py-1"
                                            />
                                          </div>
                                          {(variant.rentalConfigurations || [])
                                            .length > 1 ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                removeVariantRentalTerm(
                                                  index,
                                                  cidx,
                                                )
                                              }
                                              className="shrink-0 text-gray-400 hover:text-red-600 text-sm px-1"
                                              aria-label="Remove term"
                                            >
                                              ×
                                            </button>
                                          ) : null}
                                        </div>
                                        <div>
                                          <label className="block text-[11px] text-gray-500 mb-1">
                                            {rentLabel}
                                          </label>
                                          <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20">
                                            <span className="flex items-center px-2.5 text-gray-500 text-sm bg-gray-50 border-r border-gray-200">
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
                                              placeholder="0"
                                              className="min-w-0 flex-1 border-0 px-2 py-2 text-sm outline-none"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-[11px] text-gray-500 mb-1">
                                            Shipping charges
                                          </label>
                                          <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20">
                                            <span className="flex items-center px-2.5 text-gray-500 text-sm bg-gray-50 border-r border-gray-200">
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
                                              placeholder="0"
                                              className="min-w-0 flex-1 border-0 px-2 py-2 text-sm outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>

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
                    </div>
                  ))}
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
                            updateVariant(index, 'variantName', e.target.value)
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
                        <input
                          value={variant.condition}
                          onChange={(e) =>
                            updateVariant(index, 'condition', e.target.value)
                          }
                          placeholder="Condition"
                          className="border rounded-lg px-3 py-2"
                        />
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
                          updateRentalConfig(idx, 'pricePerDay', e.target.value)
                        }
                        placeholder="Pricing per day"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

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
            </>
          )}

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
              {mode === 'edit' ? submitEditLabel : submitCreateLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductAddModal;
