'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  DollarSign,
  Image as ImageIcon,
  Lock,
  Save,
  Search,
  Send,
  Truck,
  X,
} from 'lucide-react';
import {
  getCategories,
  getSubCategories,
} from '../../../redux/slices/categorySlice';
import {
  apiGetVendorListingTemplate,
  apiGetVendorListingTemplates,
} from '@/service/api';

const PLACEHOLDER_IMG =
  'https://placehold.co/56x56/e5e7eb/6b7280?text=IMG';

function toNum(v, fallback = 0) {
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function specsObjectFromTemplate(t) {
  const specs =
    t?.specifications &&
    typeof t.specifications === 'object' &&
    !Array.isArray(t.specifications)
      ? { ...t.specifications }
      : {};
  if (Array.isArray(t?.productCustomSpecs)) {
    for (const row of t.productCustomSpecs) {
      const k = String(row?.label || '').trim();
      if (k) specs[k] = String(row?.value ?? '');
    }
  }
  return specs;
}

function galleryFromTemplate(t) {
  if (Array.isArray(t?.images) && t.images.length) {
    return t.images.filter(Boolean).slice(0, 5);
  }
  if (t?.image) return [t.image];
  const v0 = t?.variants?.[0];
  if (Array.isArray(v0?.images) && v0.images.length) {
    return v0.images.filter(Boolean).slice(0, 5);
  }
  return [];
}

function defaultMonthTiers() {
  return [
    {
      months: 3,
      days: 0,
      label: '3 Months',
      tierLabel: 'SHORT TERM',
      monthlyRent: '',
      shippingCharges: '',
      bestValue: false,
    },
    {
      months: 6,
      days: 0,
      label: '6 Months',
      tierLabel: 'STANDARD',
      monthlyRent: '',
      shippingCharges: '',
      bestValue: false,
    },
    {
      months: 12,
      days: 0,
      label: '12 Months',
      tierLabel: 'LONG TERM',
      monthlyRent: '',
      shippingCharges: '',
      bestValue: true,
    },
  ];
}

function defaultDayTiers() {
  return [
    {
      months: 0,
      days: 3,
      label: '3 Days',
      tierLabel: 'SHORT TERM',
      monthlyRent: '',
      shippingCharges: '',
      bestValue: false,
    },
    {
      months: 0,
      days: 5,
      label: '5 Days',
      tierLabel: 'STANDARD',
      monthlyRent: '',
      shippingCharges: '',
      bestValue: false,
    },
    {
      months: 0,
      days: 7,
      label: '7 Days',
      tierLabel: 'LONG TERM',
      monthlyRent: '',
      shippingCharges: '',
      bestValue: true,
    },
  ];
}

function rentalTiersFromTemplate(template, model) {
  const raw =
    Array.isArray(template?.rentalConfigurations) &&
    template.rentalConfigurations.length
      ? template.rentalConfigurations
      : template?.variants?.[0]?.rentalConfigurations;
  if (!Array.isArray(raw) || !raw.length) {
    return model === 'day' ? defaultDayTiers() : defaultMonthTiers();
  }
  const useDay = model === 'day';
  return raw.slice(0, 6).map((cfg, i) => {
    const periodUnit = cfg.periodUnit === 'day' ? 'day' : 'month';
    const effectiveDay = useDay || periodUnit === 'day';
    const months = effectiveDay
      ? 0
      : toNum(cfg.months, [3, 6, 12][i] || 3);
    const days = effectiveDay
      ? toNum(cfg.days, [3, 5, 7][i] || 3 + i * 2)
      : 0;
    const rentVal =
      cfg.customerRent != null && cfg.customerRent !== ''
        ? String(cfg.customerRent)
        : cfg.pricePerDay != null && cfg.pricePerDay !== ''
          ? String(cfg.pricePerDay)
          : '';
    const shipVal =
      cfg.customerShipping != null && cfg.customerShipping !== ''
        ? String(cfg.customerShipping)
        : '';
    return {
      months,
      days,
      label:
        String(cfg.label || '').trim() ||
        (effectiveDay ? `${days} Days` : `${months} Months`),
      tierLabel: String(cfg.tierLabel || '').trim(),
      monthlyRent: rentVal,
      shippingCharges: shipVal,
      bestValue: i === 2,
    };
  });
}

function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
  headerRight,
  className = '',
  showLock = false,
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/90">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? (
            <Icon className="h-5 w-5 text-emerald-600 shrink-0" strokeWidth={2} />
          ) : null}
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
            {title}
          </h3>
          {showLock ? (
            <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden />
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge ? (
            <span className="text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5">
              {badge}
            </span>
          ) : null}
          {headerRight}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function VendorProductAddModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialData = null,
}) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.vendor?.token);
  const { categories, subCategories } = useSelector((state) => state.category);

  const [listingType, setListingType] = useState('rent');
  const [templates, setTemplates] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyLoadingId, setApplyLoadingId] = useState(null);

  const [customListing, setCustomListing] = useState(false);
  const [fullTemplate, setFullTemplate] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('Good');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState({});

  const [variantIndices, setVariantIndices] = useState([]);
  const [rentalPricingModel, setRentalPricingModel] = useState('month');
  const [rentalTiers, setRentalTiers] = useState(defaultMonthTiers());
  const [refundableDeposit, setRefundableDeposit] = useState('');

  const [logistics, setLogistics] = useState({
    deliveryTimelineValue: '',
    deliveryTimelineUnit: 'Days',
    inventoryOwnerName: '',
    city: '',
  });
  const [stock, setStock] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const resetCreateState = useCallback(() => {
    setListingType('rent');
    setSearchQuery('');
    setCustomListing(false);
    setFullTemplate(null);
    setSelectedTemplateId(null);
    setCategoryId('');
    setSubCategoryId('');
    setProductName('');
    setBrand('');
    setCondition('Good');
    setShortDescription('');
    setDescription('');
    setSpecs({});
    setVariantIndices([]);
    setRentalPricingModel('month');
    setRentalTiers(defaultMonthTiers());
    setRefundableDeposit('');
    setLogistics({
      deliveryTimelineValue: '',
      deliveryTimelineUnit: 'Days',
      inventoryOwnerName: '',
      city: '',
    });
    setStock('');
    setExistingImages([]);
    setNewImages([]);
  }, []);

  const hydrateFromVendorProduct = useCallback((p) => {
    setCustomListing(false);
    setFullTemplate(null);
    setSelectedTemplateId(null);
    setListingType('rent');
    setProductName(p.productName || '');
    setBrand(p.brand || '');
    setCondition(p.condition || 'Good');
    setShortDescription(p.shortDescription || '');
    setDescription(p.description || '');
    setSpecs(
      p.specifications && typeof p.specifications === 'object'
        ? { ...p.specifications }
        : {},
    );
    setExistingImages(
      Array.isArray(p.images) && p.images.length
        ? p.images.filter(Boolean).slice(0, 5)
        : p.image
          ? [p.image]
          : [],
    );
    setNewImages([]);
    const nVar = Array.isArray(p.variants) ? p.variants.length : 0;
    setVariantIndices(
      nVar ? Array.from({ length: nVar }, (_, i) => i) : [],
    );
    const rc = Array.isArray(p.rentalConfigurations)
      ? p.rentalConfigurations
      : [];
    const model =
      rc.length && rc.some((c) => c.periodUnit === 'day') ? 'day' : 'month';
    setRentalPricingModel(model);
    if (rc.length) {
      setRentalTiers(
        rc.slice(0, 6).map((cfg, i) => ({
          months: toNum(cfg.months, model === 'day' ? 0 : [3, 6, 12][i] || 3),
          days: toNum(cfg.days, 0),
          label: String(cfg.label || ''),
          tierLabel: '',
          monthlyRent: String(
            cfg.customerRent != null && cfg.customerRent !== ''
              ? cfg.customerRent
              : cfg.pricePerDay ?? '',
          ),
          shippingCharges: String(cfg.shippingCharges ?? ''),
          bestValue: i === 2,
        })),
      );
    } else {
      setRentalTiers(
        model === 'day' ? defaultDayTiers() : defaultMonthTiers(),
      );
    }
    setRefundableDeposit(
      p.refundableDeposit != null ? String(p.refundableDeposit) : '',
    );
    const lv = p.logisticsVerification || {};
    setLogistics({
      deliveryTimelineValue:
        lv.deliveryTimelineValue != null
          ? String(lv.deliveryTimelineValue)
          : '',
      deliveryTimelineUnit: lv.deliveryTimelineUnit || 'Days',
      inventoryOwnerName: lv.inventoryOwnerName || '',
      city: lv.city || '',
    });
    setStock(p.stock != null ? String(p.stock) : '');
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    dispatch(getCategories());
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (!isOpen || !token) return;
    setLoadingList(true);
    apiGetVendorListingTemplates(token)
      .then((res) => setTemplates(res.data?.listingTemplates || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingList(false));
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      hydrateFromVendorProduct(initialData);
    } else if (mode === 'create') {
      resetCreateState();
    }
  }, [isOpen, mode, initialData, hydrateFromVendorProduct, resetCreateState]);

  useEffect(() => {
    if (!categoryId) return;
    dispatch(getSubCategories(categoryId));
  }, [categoryId, dispatch]);

  const categoryName = useMemo(() => {
    if (fullTemplate?.category) return fullTemplate.category;
    const c = categories.find((x) => x._id === categoryId);
    return c?.name || '';
  }, [fullTemplate, categories, categoryId]);

  const subCategoryName = useMemo(() => {
    if (fullTemplate?.subCategory) return fullTemplate.subCategory;
    const s = subCategories.find((x) => x._id === subCategoryId);
    return s?.name || '';
  }, [fullTemplate, subCategories, subCategoryId]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      if (!q) return true;
      return (
        String(t.productName || '')
          .toLowerCase()
          .includes(q) ||
        String(t.sku || '')
          .toLowerCase()
          .includes(q) ||
        String(t.category || '')
          .toLowerCase()
          .includes(q) ||
        String(t.subCategory || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [templates, searchQuery]);

  const applyTemplate = async (row) => {
    if (!token) return;
    setApplyLoadingId(row._id);
    try {
      const res = await apiGetVendorListingTemplate(row._id, token);
      const t = res.data?.listingTemplate;
      if (!t) {
        toast.error('Template not found.');
        return;
      }
      setCustomListing(false);
      setFullTemplate(t);
      setSelectedTemplateId(t._id);
      setProductName(t.productName || '');
      setBrand(t.brand || '');
      setCondition(t.condition || 'Good');
      setShortDescription(t.shortDescription || '');
      setDescription(t.description || '');
      setSpecs(specsObjectFromTemplate(t));
      setExistingImages(galleryFromTemplate(t));
      setNewImages([]);
      const n = Array.isArray(t.variants) ? t.variants.length : 0;
      setVariantIndices(n ? Array.from({ length: n }, (_, i) => i) : []);
      const vModel =
        t.variants?.[0]?.rentalPricingModel === 'day' ? 'day' : 'month';
      setRentalPricingModel(vModel);
      setRefundableDeposit(
        t.refundableDeposit != null ? String(t.refundableDeposit) : '',
      );
      const lv = t.logisticsVerification || {};
      setLogistics((prev) => ({
        ...prev,
        inventoryOwnerName: lv.inventoryOwnerName || prev.inventoryOwnerName,
        city: lv.city || prev.city,
      }));
      setStock(t.stock != null ? String(t.stock) : '');
      toast.success('Template loaded. Review logistics and submit.');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load template.');
    } finally {
      setApplyLoadingId(null);
    }
  };

  const onCustomListing = () => {
    resetCreateState();
    setCustomListing(true);
    setFullTemplate(null);
    setSelectedTemplateId(null);
  };

  const removeVariantIndex = (idx) => {
    setVariantIndices((prev) => prev.filter((i) => i !== idx));
  };

  const addRentalTier = () => {
    setRentalTiers((prev) => [
      ...prev,
      rentalPricingModel === 'day'
        ? {
            months: 0,
            days: (prev[prev.length - 1]?.days || 7) + 2,
            label: '',
            tierLabel: '',
            monthlyRent: '',
            shippingCharges: '',
            bestValue: false,
          }
        : {
            months: (prev[prev.length - 1]?.months || 12) + 3,
            days: 0,
            label: '',
            tierLabel: '',
            monthlyRent: '',
            shippingCharges: '',
            bestValue: false,
          },
    ]);
  };

  const removeRentalTier = (i) => {
    setRentalTiers((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
  };

  const updateTier = (i, field, value) => {
    setRentalTiers((prev) =>
      prev.map((row, j) => (j === i ? { ...row, [field]: value } : row)),
    );
  };

  const buildVariantsPayload = () => {
    if (fullTemplate && Array.isArray(fullTemplate.variants)) {
      const rows = variantIndices
        .map((i) => fullTemplate.variants[i])
        .filter(Boolean)
        .map((v) => ({
          variantName: String(v.variantName || '').trim(),
          color: String(v.color || '').trim(),
          storage: String(v.storage || '').trim(),
          ram: String(v.ram || '').trim(),
          condition: String(v.condition || condition || '').trim(),
          price: String(v.price || fullTemplate.price || '').trim(),
          stock: toNum(v.stock, 0),
        }));
      if (rows.length) return rows;
    }
    return [
      {
        variantName: productName || 'Default',
        color: '',
        storage: '',
        ram: '',
        condition: String(condition || '').trim(),
        price: String(fullTemplate?.price || '').trim(),
        stock: 0,
      },
    ];
  };

  const buildRentalPayload = () =>
    rentalTiers.map((t, i) => ({
      months: rentalPricingModel === 'month' ? toNum(t.months, [3, 6, 12][i] || 3) : 0,
      days: rentalPricingModel === 'day' ? toNum(t.days, [3, 5, 7][i] || 3) : 0,
      periodUnit: rentalPricingModel,
      label: String(t.label || '').trim(),
      pricePerDay:
        rentalPricingModel === 'day' ? toNum(t.monthlyRent, 0) : 0,
      customerRent: toNum(t.monthlyRent, 0),
      shippingCharges: toNum(t.shippingCharges, 0),
    }));

  const validate = (submissionStatus) => {
    if (!String(productName || '').trim()) {
      toast.error('Product name is required.');
      return false;
    }
    if (!String(categoryName || '').trim() || !String(subCategoryName || '').trim()) {
      toast.error('Category and sub-category are required.');
      return false;
    }
    if (submissionStatus !== 'draft') {
      if (
        !existingImages.length &&
        !newImages.length &&
        !fullTemplate &&
        !customListing
      ) {
        toast.error('Add at least one product image.');
        return false;
      }
      if (!String(logistics.deliveryTimelineValue || '').trim()) {
        toast.error('Delivery timeline is required.');
        return false;
      }
      if (!String(stock || '').trim()) {
        toast.error('Inventory count is required.');
        return false;
      }
    }
    return true;
  };

  const submit = (submissionStatus) => {
    if (!validate(submissionStatus)) return;
    const imgs = [...existingImages];
    const priceLabel =
      rentalTiers[0]?.monthlyRent != null && String(rentalTiers[0].monthlyRent).trim() !== ''
        ? `₹${rentalTiers[0].monthlyRent}/mo`
        : fullTemplate?.price || '0';

    onSubmit({
      productName: String(productName).trim(),
      type: 'Rental',
      category: categoryName,
      subCategory: subCategoryName,
      brand: String(brand || '').trim(),
      condition: condition || 'Good',
      shortDescription: String(shortDescription || '').trim(),
      description: String(description || '').trim(),
      specifications: specs,
      variants: buildVariantsPayload(),
      rentalConfigurations: buildRentalPayload(),
      refundableDeposit: toNum(refundableDeposit, 0),
      logisticsVerification: {
        inventoryOwnerName: String(logistics.inventoryOwnerName || '').trim(),
        city: String(logistics.city || '').trim(),
        deliveryTimelineValue: toNum(logistics.deliveryTimelineValue, 0),
        deliveryTimelineUnit: logistics.deliveryTimelineUnit || 'Days',
      },
      existingImages: imgs.filter(Boolean).slice(0, 5),
      images: newImages,
      price: priceLabel,
      stock: toNum(stock, 0),
      status: 'Active',
      submissionStatus,
    });
  };

  useEffect(() => {
    if (!fullTemplate) return;
    setRentalTiers(rentalTiersFromTemplate(fullTemplate, rentalPricingModel));
  }, [rentalPricingModel, fullTemplate]);

  useEffect(() => {
    if (!isOpen || mode !== 'edit' || !initialData || !categories.length) return;
    const c = categories.find((x) => x.name === initialData.category);
    if (c) setCategoryId(c._id);
  }, [isOpen, mode, initialData, categories]);

  useEffect(() => {
    if (!isOpen || mode !== 'edit' || !initialData || !subCategories.length) return;
    const s = subCategories.find((x) => x.name === initialData.subCategory);
    if (s) setSubCategoryId(s._id);
  }, [isOpen, mode, initialData, subCategories]);

  if (!isOpen) return null;

  const showDetailSections =
    mode === 'edit' ||
    fullTemplate ||
    (customListing && categoryId && subCategoryId);

  const displayVariants =
    fullTemplate && Array.isArray(fullTemplate.variants)
      ? variantIndices
          .map((i) => ({ index: i, v: fullTemplate.variants[i] }))
          .filter((x) => x.v)
      : [];

  const specEntries = Object.entries(specs).filter(
    ([k, v]) => k && v != null && String(v).trim() !== '',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl bg-gray-50 shadow-2xl border border-gray-200">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 py-4 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Listing' : 'Add New Listing'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              List your product, rental, or service.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Listing type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'sell', label: 'Sell Product', sub: 'One-time purchase' },
              { id: 'rent', label: 'Rent Out', sub: 'Monthly rental' },
              { id: 'service', label: 'Offer Service', sub: 'Hourly / fixed' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={opt.id !== 'rent'}
                onClick={() => opt.id === 'rent' && setListingType(opt.id)}
                className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                  listingType === opt.id
                    ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-200'
                    : 'border-gray-200 bg-white opacity-60'
                } ${opt.id === 'rent' ? 'cursor-pointer opacity-100' : 'cursor-not-allowed'}`}
              >
                <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{opt.sub}</p>
              </button>
            ))}
          </div>

          {/* Category / subcategory (from template or manual) */}
          <SectionCard title="What are you renting?">
            <div className="flex flex-wrap items-center gap-2">
              {fullTemplate ? (
                <>
                  <span className="inline-flex items-center rounded-xl border-2 border-orange-400 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-900">
                    {categoryName || '—'}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="inline-flex items-center rounded-xl border-2 border-orange-400 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-900">
                    {subCategoryName || '—'}
                  </span>
                  <p className="w-full text-xs text-gray-500 mt-2">
                    Filled automatically from the standard product you add below.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-full sm:w-[calc(50%-0.25rem)]">
                    <label className="text-xs text-gray-500">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setSubCategoryId('');
                      }}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[calc(50%-0.25rem)]">
                    <label className="text-xs text-gray-500">Sub-category</label>
                    <select
                      value={subCategoryId}
                      onChange={(e) => setSubCategoryId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      disabled={!categoryId}
                    >
                      <option value="">Select sub-category</option>
                      {subCategories.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="w-full text-xs text-gray-500">
                    {customListing
                      ? 'Custom listing: choose category, then fill details below.'
                      : 'Pick a standard product to auto-fill category and details.'}
                  </p>
                </>
              )}
            </div>
          </SectionCard>

          {/* Standard catalog */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/90">
              <h3 className="text-sm font-semibold text-gray-900">
                Search Standard Listed Products
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Admin templates — Add loads catalog data into this form.
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Product Name or SKU..."
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={onCustomListing}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 shrink-0"
                >
                  + Custom Listing
                </button>
              </div>
              <div className="max-h-[min(280px,40vh)] overflow-y-auto rounded-xl border border-gray-100">
                {loadingList && templates.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-500">
                    Loading templates…
                  </p>
                ) : filteredTemplates.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-500">
                    No templates match your search.
                  </p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 text-left text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium hidden sm:table-cell">
                          Category
                        </th>
                        <th className="px-3 py-2 font-medium hidden md:table-cell">
                          Sub-category
                        </th>
                        <th className="px-3 py-2 font-medium w-24 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTemplates.map((row) => {
                        const added = selectedTemplateId === row._id;
                        return (
                          <tr key={row._id} className="hover:bg-gray-50/80">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    row.images?.[0] ||
                                    row.image ||
                                    PLACEHOLDER_IMG
                                  }
                                  alt=""
                                  className="h-11 w-11 rounded-lg object-cover border border-gray-100"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate max-w-[180px] sm:max-w-none">
                                    {row.productName}
                                  </p>
                                  {row.sku ? (
                                    <p className="text-[11px] text-gray-400">
                                      SKU: {row.sku}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 hidden sm:table-cell text-gray-600">
                              {row.category || '—'}
                            </td>
                            <td className="px-3 py-2 hidden md:table-cell text-gray-600">
                              {row.subCategory || '—'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {added ? (
                                <span className="text-sm font-medium text-emerald-600">
                                  Added
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!!applyLoadingId}
                                  onClick={() => applyTemplate(row)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {applyLoadingId === row._id ? '…' : 'Add'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {showDetailSections ? (
            <>
              <SectionCard
                title="Product Media"
                icon={ImageIcon}
                badge="Catalog Images"
                showLock
              >
                <div className="flex flex-wrap gap-3">
                  {existingImages.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative">
                      <img
                        src={url}
                        alt=""
                        className="h-24 w-24 rounded-xl object-cover border border-gray-200"
                      />
                      <span className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                  {newImages.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="h-24 w-24 rounded-xl object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewImages((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-orange-400">
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).slice(
                          0,
                          Math.max(
                            0,
                            5 - existingImages.length - newImages.length,
                          ),
                        );
                        setNewImages((prev) => [...prev, ...files]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </SectionCard>

              <SectionCard title="Basic Information" icon={null} badge="Verified Specs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Product name</label>
                    <input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      readOnly={!!fullTemplate && mode === 'create'}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        fullTemplate && mode === 'create'
                          ? 'bg-gray-50 text-gray-800'
                          : 'bg-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Brand</label>
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      readOnly={!!fullTemplate && mode === 'create'}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        fullTemplate && mode === 'create'
                          ? 'bg-gray-50'
                          : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Condition</label>
                    <input
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      readOnly={!!fullTemplate && mode === 'create'}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        fullTemplate && mode === 'create'
                          ? 'bg-gray-50'
                          : ''
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500">Short description</label>
                    <input
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      readOnly={!!fullTemplate && mode === 'create'}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        fullTemplate && mode === 'create'
                          ? 'bg-gray-50'
                          : ''
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      readOnly={!!fullTemplate && mode === 'create'}
                      rows={3}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        fullTemplate && mode === 'create'
                          ? 'bg-gray-50'
                          : ''
                      }`}
                    />
                  </div>
                </div>
                {specEntries.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specEntries.map(([k, v]) => (
                      <div key={k}>
                        <label className="text-xs text-gray-500 capitalize">
                          {k}
                        </label>
                        <input
                          value={String(v)}
                          readOnly
                          className="mt-1 w-full rounded-xl border bg-gray-50 px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </SectionCard>

              {fullTemplate && displayVariants.length > 0 ? (
                <SectionCard title="Product Variants">
                  <p className="text-xs text-gray-500 mb-3">
                    Selected variants for this listing. Remove any you do not offer.
                  </p>
                  <ul className="space-y-2">
                    {displayVariants.map(({ index, v }) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2"
                      >
                        <img
                          src={
                            v.images?.[0] ||
                            existingImages[0] ||
                            PLACEHOLDER_IMG
                          }
                          alt=""
                          className="h-14 w-14 rounded-lg object-cover border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {v.variantName || 'Variant'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {v.price ? `From ${v.price}` : ''}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                              {categoryName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                              {subCategoryName}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantIndex(index)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                          aria-label="Remove variant"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              ) : null}

              <SectionCard
                title="Rental Configuration"
                icon={DollarSign}
                headerRight={
                  <button
                    type="button"
                    onClick={addRentalTier}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    + Add More Term
                  </button>
                }
              >
                <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-100 mb-4 w-fit">
                  <button
                    type="button"
                    onClick={() => setRentalPricingModel('month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      rentalPricingModel === 'month'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-600'
                    }`}
                  >
                    Month-wise
                  </button>
                  <button
                    type="button"
                    onClick={() => setRentalPricingModel('day')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      rentalPricingModel === 'day'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-600'
                    }`}
                  >
                    Day-wise
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {rentalTiers.map((tier, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl border-2 border-orange-200 bg-orange-50/30 p-3"
                    >
                      {tier.bestValue ? (
                        <span className="absolute top-2 right-2 text-[10px] font-semibold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                          Best value
                        </span>
                      ) : null}
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        {tier.tierLabel ||
                          (rentalPricingModel === 'day' ? 'Term' : 'Term')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {rentalPricingModel === 'day'
                          ? `${tier.days || 0} Days`
                          : `${tier.months || 0} Months`}
                      </p>
                      <label className="text-xs text-gray-600">
                        {rentalPricingModel === 'day'
                          ? 'Rent (per day)'
                          : 'Monthly rent'}
                      </label>
                      <div className="mt-1 flex rounded-lg border border-gray-200 bg-white">
                        <span className="pl-2 flex items-center text-gray-500 text-sm">
                          ₹
                        </span>
                        <input
                          value={tier.monthlyRent}
                          onChange={(e) =>
                            updateTier(i, 'monthlyRent', e.target.value)
                          }
                          className="w-full py-2 pr-2 text-sm outline-none rounded-lg"
                        />
                      </div>
                      <label className="text-xs text-gray-600 mt-2 block">
                        Shipping charges
                      </label>
                      <div className="mt-1 flex rounded-lg border border-gray-200 bg-white">
                        <span className="pl-2 flex items-center text-gray-500 text-sm">
                          ₹
                        </span>
                        <input
                          value={tier.shippingCharges}
                          onChange={(e) =>
                            updateTier(i, 'shippingCharges', e.target.value)
                          }
                          className="w-full py-2 pr-2 text-sm outline-none rounded-lg"
                        />
                      </div>
                      {rentalTiers.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeRentalTier(i)}
                          className="mt-2 text-xs text-red-600 hover:underline"
                        >
                          Remove term
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Refundable Deposit
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Security deposit returned after rental period ends
                </p>
                <div className="mt-3 flex rounded-xl border border-violet-200 bg-white max-w-xs">
                  <span className="pl-3 flex items-center text-gray-500">₹</span>
                  <input
                    value={refundableDeposit}
                    onChange={(e) => setRefundableDeposit(e.target.value)}
                    className="w-full py-2.5 pr-3 text-sm outline-none rounded-xl"
                  />
                </div>
              </div>

              <SectionCard title="Logistics & Verification" icon={Truck}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Delivery timeline <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <input
                        value={logistics.deliveryTimelineValue}
                        onChange={(e) =>
                          setLogistics((p) => ({
                            ...p,
                            deliveryTimelineValue: e.target.value,
                          }))
                        }
                        className="flex-1 min-w-0 px-3 py-2.5 text-sm outline-none"
                        placeholder="e.g. 3"
                      />
                      <select
                        value={logistics.deliveryTimelineUnit}
                        onChange={(e) =>
                          setLogistics((p) => ({
                            ...p,
                            deliveryTimelineUnit: e.target.value,
                          }))
                        }
                        className="border-l border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                      >
                        <option value="Days">Days</option>
                        <option value="Hours">Hours</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Days required to deliver after order confirmation
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Inventory count <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                      placeholder="Units available"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of units available for rent
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Inventory owner (optional)
                    </label>
                    <input
                      value={logistics.inventoryOwnerName}
                      onChange={(e) =>
                        setLogistics((p) => ({
                          ...p,
                          inventoryOwnerName: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">City (optional)</label>
                    <input
                      value={logistics.city}
                      onChange={(e) =>
                        setLogistics((p) => ({ ...p, city: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </SectionCard>
            </>
          ) : null}

          <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 pb-1 bg-gray-50 border-t border-gray-200 -mx-4 px-4 sm:-mx-5 sm:px-5">
            <button
              type="button"
              onClick={() => submit('draft')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() =>
                submit(mode === 'edit' ? 'published' : 'pending_approval')
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              {mode === 'edit' ? 'Update Product' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
