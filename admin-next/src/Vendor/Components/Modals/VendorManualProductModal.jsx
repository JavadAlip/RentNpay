'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

import {
  getCategories,
  getSubCategories,
} from '../../../redux/slices/categorySlice';

import AdminProductAddModal from '../../../Admin/Components/Modals/AdminProductAddModal.jsx';

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

function SectionTitle({ title }) {
  return <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>;
}

const toNum = (v, fallback = 0) => {
  const s = String(v ?? '')
    .replace(/,/g, '')
    .trim();
  if (!s) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
};

function getSpecValue(specRows, pred) {
  if (!Array.isArray(specRows) || !specRows.length) return '';
  const hit = specRows.find((r) => pred(String(r?.label || '').toLowerCase(), r?.value));
  return hit?.value == null ? '' : String(hit.value).trim();
}

function convertAdminFlexibleFormToVendorPayload(adminForm) {
  const variants = Array.isArray(adminForm?.variants) ? adminForm.variants : [];
  const v0 = variants[0] || {};

  const specMap = { ...(adminForm?.specifications && typeof adminForm.specifications === 'object' ? adminForm.specifications : {}) };
  if (Array.isArray(adminForm?.productCustomSpecs)) {
    for (const row of adminForm.productCustomSpecs) {
      const k = String(row?.label || '').trim();
      if (!k) continue;
      const v = row?.value ?? '';
      specMap[k] = String(v).trim();
    }
  }

  // Merge variant specRows into product.specifications so storefront can display them.
  for (const v of variants) {
    const specRows = Array.isArray(v?.specRows) ? v.specRows : [];
    for (const row of specRows) {
      const k = String(row?.label || '').trim();
      if (!k) continue;
      const val = row?.value ?? '';
      specMap[k] = String(val).trim();
    }
  }

  const images = [];
  const existingImages = [];
  for (const v of variants) {
    if (Array.isArray(v?.images) && v.images.length) {
      for (const f of v.images) images.push(f);
    }
    if (Array.isArray(v?.existingVariantImages) && v.existingVariantImages.length) {
      for (const u of v.existingVariantImages) existingImages.push(u);
    }
  }

  const variantsPayload = variants
    .filter((v) => String(v?.variantName || '').trim())
    .map((v) => {
      const specRows = Array.isArray(v?.specRows) ? v.specRows : [];
      const color = getSpecValue(specRows, (label) => (
        label === 'color' ||
        label === 'colour' ||
        label.includes('color') ||
        label.includes('colour')
      ));
      const storage = getSpecValue(specRows, (label) => (
        label === 'storage' ||
        label.includes('storage') ||
        label.includes('capacity') ||
        label.includes('ssd') ||
        label.includes('hdd')
      ));
      const ram = getSpecValue(specRows, (label) => (
        label === 'ram' ||
        label.includes('ram') ||
        label.includes('memory')
      ));

      return {
        variantName: String(v.variantName || '').trim(),
        color,
        storage,
        ram,
        condition: String(adminForm?.condition || '').trim(),
        price: String(v?.price || '').trim(),
        stock: toNum(v?.stock, 0),
      };
    });

  const rentalSource = Array.isArray(v0?.rentalConfigurations)
    ? v0.rentalConfigurations
    : [];

  const rentalConfigurations = rentalSource.length
    ? rentalSource.map((cfg) => {
        const periodUnit = cfg?.periodUnit === 'day' ? 'day' : 'month';
        const customerRent =
          cfg?.customerRent != null && String(cfg.customerRent).trim() !== ''
            ? cfg.customerRent
            : cfg?.pricePerDay != null
              ? cfg.pricePerDay
              : 0;
        const customerShipping = cfg?.customerShipping ?? cfg?.shippingCharges ?? 0;
        return {
          months: toNum(cfg?.months, periodUnit === 'month' ? 3 : 0),
          days: periodUnit === 'day' ? toNum(cfg?.days, 3) : 0,
          periodUnit,
          label: String(cfg?.label || '').trim(),
          pricePerDay: toNum(customerRent, 0),
          customerRent: toNum(customerRent, 0),
          shippingCharges: toNum(customerShipping, 0),
        };
      })
    : [];

  return {
    productName: String(adminForm?.productName || '').trim(),
    type: 'Rental',
    category: String(adminForm?.category || '').trim(),
    subCategory: String(adminForm?.subCategory || '').trim(),
    brand: String(adminForm?.brand || '').trim(),
    condition: String(adminForm?.condition || 'Good').trim(),
    shortDescription: String(adminForm?.shortDescription || '').trim(),
    description: String(adminForm?.description || '').trim(),
    specifications: specMap,
    variants: variantsPayload.length ? variantsPayload : [],
    rentalConfigurations,
    refundableDeposit: toNum(v0?.refundableDeposit ?? adminForm?.refundableDeposit, 0),
    logisticsVerification: {
      inventoryOwnerName: String(adminForm?.logisticsVerification?.inventoryOwnerName || '').trim(),
      city: String(adminForm?.logisticsVerification?.city || '').trim(),
      deliveryTimelineValue: 0,
      deliveryTimelineUnit: 'Days',
    },
    existingImages: existingImages.filter(Boolean).slice(0, 5),
    images: images.filter(Boolean).slice(0, 5),
    price: String(adminForm?.price || '0'),
    stock: toNum(adminForm?.stock, 0),
    status: String(adminForm?.status || 'Active'),
    submissionStatus: 'published',
  };
}

function VendorManualProductModalAdminStyle({
  isOpen,
  onClose,
  onSubmit,
}) {
  return (
    <AdminProductAddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(adminForm) => {
        const payload = convertAdminFlexibleFormToVendorPayload(adminForm);
        return onSubmit?.(payload);
      }}
      mode="create"
      enableStandardProductSearch={false}
      flexibleListingForm
      standardCatalogTableOnly={true}
      subtitle="Rental listing form"
      submitCreateLabel="Save listing template"
    />
  );
}

const defaultRentalConfigs = () => [
  {
    months: 3,
    label: '3 Months',
    pricePerDay: '',
    customerRent: 0,
    shippingCharges: 0,
    periodUnit: 'month',
  },
  {
    months: 6,
    label: '6 Months',
    pricePerDay: '',
    customerRent: 0,
    shippingCharges: 0,
    periodUnit: 'month',
  },
  {
    months: 12,
    label: '12 Months',
    pricePerDay: '',
    customerRent: 0,
    shippingCharges: 0,
    periodUnit: 'month',
  },
];

function VendorManualProductModalVendorStyle({
  isOpen,
  onClose,
  onSubmit,
}) {
  const dispatch = useDispatch();
  const { categories, subCategories } = useSelector((s) => s.category);

  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  const categoryName = useMemo(
    () => categories.find((c) => c._id === categoryId)?.name || '',
    [categories, categoryId],
  );
  const subCategoryName = useMemo(
    () => subCategories.find((s) => s._id === subCategoryId)?.name || '',
    [subCategories, subCategoryId],
  );

  const categoryKey = useMemo(() => {
    const k = String(categoryName || '').toLowerCase();
    if (k.includes('furniture')) return 'furniture';
    if (k.includes('vehicle') || k.includes('car')) return 'vehicle';
    return 'electronics';
  }, [categoryName]);

  const activeSpecFields = SPEC_FIELDS_BY_CATEGORY[categoryKey] || [];

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('Good');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');

  const [specifications, setSpecifications] = useState({});

  const [variants, setVariants] = useState([
    {
      variantName: '',
      color: '',
      storage: '',
      ram: '',
      condition: 'Like New',
      price: '',
      stock: 0,
    },
  ]);

  const [rentalConfigurations, setRentalConfigurations] = useState(
    defaultRentalConfigs(),
  );

  const [refundableDeposit, setRefundableDeposit] = useState('');
  const [deliveryTimelineValue, setDeliveryTimelineValue] = useState('');
  const [deliveryTimelineUnit, setDeliveryTimelineUnit] = useState('Days');
  const [inventoryOwnerName, setInventoryOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [stock, setStock] = useState('');

  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    dispatch(getCategories());
    setCategoryId('');
    setSubCategoryId('');
    setProductName('');
    setBrand('');
    setCondition('Good');
    setShortDescription('');
    setDescription('');
    setSpecifications({});
    setVariants([
      {
        variantName: '',
        color: '',
        storage: '',
        ram: '',
        condition: 'Like New',
        price: '',
        stock: 0,
      },
    ]);
    setRentalConfigurations(defaultRentalConfigs());
    setRefundableDeposit('');
    setDeliveryTimelineValue('');
    setDeliveryTimelineUnit('Days');
    setInventoryOwnerName('');
    setCity('');
    setStock('');
    setNewImages([]);
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (!categoryId) return;
    dispatch(getSubCategories(categoryId));
  }, [categoryId, dispatch]);

  const priceLabel = useMemo(() => {
    const first = rentalConfigurations[0];
    const rent = toNum(first?.pricePerDay, 0);
    return rent ? `₹${rent}/mo` : '₹0/mo';
  }, [rentalConfigurations]);

  const handleChangeSpec = (key, value) => {
    setSpecifications((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!String(productName || '').trim()) {
      toast.error('Product name is required.');
      return false;
    }
    if (
      !String(categoryName || '').trim() ||
      !String(subCategoryName || '').trim()
    ) {
      toast.error('Category and sub-category are required.');
      return false;
    }
    if (!newImages.length) {
      toast.error('Add at least one product image.');
      return false;
    }
    if (!String(deliveryTimelineValue || '').trim()) {
      toast.error('Delivery timeline is required.');
      return false;
    }
    if (!String(stock || '').trim()) {
      toast.error('Inventory count is required.');
      return false;
    }
    const anyVariant = variants.some((v) =>
      String(v?.variantName || '').trim(),
    );
    if (!anyVariant) {
      toast.error('Enter at least one variant name.');
      return false;
    }
    const anyTierPrice = rentalConfigurations.some(
      (c) => toNum(c?.pricePerDay, 0) > 0,
    );
    if (!anyTierPrice) {
      toast.error('Add at least one rental tier price.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const variantsPayload = variants
      .filter((v) => String(v.variantName || '').trim())
      .map((v) => ({
        variantName: String(v.variantName || '').trim(),
        color: String(v.color || '').trim(),
        storage: String(v.storage || '').trim(),
        ram: String(v.ram || '').trim(),
        condition: String(v.condition || 'Like New').trim(),
        price: String(v.price || '').trim(),
        stock: toNum(v.stock, 0),
      }));

    const rentalPayload = rentalConfigurations.map((c) => ({
      months: toNum(c.months, 0),
      days: 0,
      periodUnit: 'month',
      label: String(c.label || '').trim(),
      pricePerDay: toNum(c.pricePerDay, 0),
      customerRent: toNum(c.pricePerDay, 0),
      shippingCharges: 0,
    }));

    const payload = {
      productName: String(productName).trim(),
      type: 'Rental',
      category: categoryName,
      subCategory: subCategoryName,
      brand: String(brand || '').trim(),
      condition: condition || 'Good',
      shortDescription: String(shortDescription || '').trim(),
      description: String(description || '').trim(),
      specifications: specifications || {},
      variants: variantsPayload,
      rentalConfigurations: rentalPayload,
      refundableDeposit: toNum(refundableDeposit, 0),
      logisticsVerification: {
        inventoryOwnerName: String(inventoryOwnerName || '').trim(),
        city: String(city || '').trim(),
        deliveryTimelineValue: toNum(deliveryTimelineValue, 0),
        deliveryTimelineUnit,
      },
      existingImages: [],
      images: newImages,
      price: priceLabel,
      stock: toNum(stock, 0),
      status: 'Active',
      submissionStatus: 'published',
    };

    const ok = await onSubmit?.(payload);
    if (ok) onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Listing
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Rental listing form</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="md:col-span-2">
            <SectionTitle title="Category" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubCategoryId('');
                  }}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Sub-category
                </label>
                <select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  disabled={!categoryId}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Select sub-category</option>
                  {subCategories.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Basic */}
          <div className="md:col-span-2">
            <SectionTitle title="Basic Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Product name
                </label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Brand
                </label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                >
                  <option>Brand New</option>
                  <option>Like New</option>
                  <option>Good</option>
                  <option>Fair</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Short description
                </label>
                <input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="md:col-span-2">
            <SectionTitle title="Product Specifications" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeSpecFields.map((f) => (
                <input
                  key={f.key}
                  value={specifications?.[f.key] || ''}
                  onChange={(e) => handleChangeSpec(f.key, e.target.value)}
                  placeholder={f.label}
                  className="border rounded-xl px-3 py-2 text-sm"
                />
              ))}
            </div>
          </div>

          {/* Media */}
          <div className="md:col-span-2">
            <SectionTitle title="Product Media" />
            <div className="flex flex-wrap gap-3">
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
                    aria-label="Remove image"
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
                      5 - newImages.length,
                    );
                    setNewImages((prev) => [...prev, ...files]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          {/* Variants */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">
                Product variants
              </p>
              <button
                type="button"
                onClick={() =>
                  setVariants((prev) => [
                    ...prev,
                    {
                      variantName: '',
                      color: '',
                      storage: '',
                      ram: '',
                      condition: 'Like New',
                      price: '',
                      stock: 0,
                    },
                  ])
                }
                className="px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="border rounded-xl p-3 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={v.variantName}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, variantName: e.target.value }
                              : x,
                          ),
                        )
                      }
                      placeholder="Variant name"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={v.color}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, color: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Color"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={v.storage}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, storage: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Storage"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={v.ram}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, ram: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="RAM"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={v.price}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, price: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Variant price"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={v.stock}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, stock: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Variant stock"
                      type="number"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  {variants.length > 1 ? (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setVariants((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
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

          {/* Rental config */}
          <div className="md:col-span-2">
            <SectionTitle title="Rental Configuration" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {rentalConfigurations.map((cfg, idx) => (
                <div
                  key={cfg.months ?? idx}
                  className="rounded-xl border border-orange-200 bg-orange-50/30 p-3"
                >
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    {cfg.label || `${cfg.months} Months`}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    {cfg.months} Months
                  </p>
                  <label className="text-xs text-gray-600">Monthly rent</label>
                  <input
                    value={cfg.pricePerDay}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRentalConfigurations((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? {
                                ...x,
                                pricePerDay: v,
                                customerRent: toNum(v, 0),
                              }
                            : x,
                        ),
                      );
                    }}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Refundable Deposit */}
          <div className="md:col-span-2">
            <SectionTitle title="Refundable Deposit" />
            <input
              value={refundableDeposit}
              onChange={(e) => setRefundableDeposit(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="0"
              inputMode="numeric"
            />
          </div>

          {/* Logistics */}
          <div className="md:col-span-2">
            <SectionTitle title="Logistics & Verification" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-800">
                  Delivery timeline <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <input
                    value={deliveryTimelineValue}
                    onChange={(e) => setDeliveryTimelineValue(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2.5 text-sm outline-none"
                    placeholder="e.g. 3"
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
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Inventory owner (optional)
                </label>
                <input
                  value={inventoryOwnerName}
                  onChange={(e) => setInventoryOwnerName(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">City (optional)</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            >
              Publish to store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorManualProductModal({
  isOpen,
  onClose,
  onSubmit,
  designMode = 'vendor',
}) {
  if (designMode === 'admin') {
    return (
      <VendorManualProductModalAdminStyle
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <VendorManualProductModalVendorStyle
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
