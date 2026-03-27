'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getCategories,
  getSubCategories,
} from '../../../../redux/slices/categorySlice';

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

const defaultForm = {
  productName: '',
  type: 'Rental',
  category: '',
  subCategory: '',
  brand: '',
  condition: 'Good',
  shortDescription: '',
  description: '',
  specifications: {},
  variants: [
    {
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
  images: [],
  existingImages: [],
};

const ProductAddModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialData = null,
  existingProducts = [],
}) => {
  const dispatch = useDispatch();
  const { categories, subCategories } = useSelector((state) => state.category);

  const [form, setForm] = useState({ ...defaultForm });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [standardSearch, setStandardSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Load categories whenever modal opens
    dispatch(getCategories());

    if (initialData) {
      setForm({
        productName: initialData.productName || '',
        type: initialData.type || 'Rental',
        category: initialData.category || '',
        subCategory: initialData.subCategory || '',
        brand: initialData.brand || '',
        condition: initialData.condition || 'Good',
        shortDescription: initialData.shortDescription || '',
        description: initialData.description || '',
        specifications: initialData.specifications || {},
        variants:
          Array.isArray(initialData.variants) && initialData.variants.length
            ? initialData.variants.map((v) => ({
                variantName: v.variantName || '',
                color: v.color || '',
                storage: v.storage || '',
                ram: v.ram || '',
                condition: v.condition || '',
                price: v.price || '',
                stock: v.stock === undefined || v.stock === null ? '' : String(v.stock),
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
        images: [],
        existingImages: Array.isArray(initialData.images)
          ? initialData.images.filter(Boolean).slice(0, 5)
          : initialData.image
            ? [initialData.image]
            : [],
      });
    } else {
      setForm({ ...defaultForm });
      setSelectedCategoryId('');
    }
  }, [isOpen, initialData, dispatch]);

  // When categories are loaded and we are editing, map category name -> id and load subcategories
  useEffect(() => {
    if (!isOpen || !initialData || !categories.length) return;

    const matched = categories.find((c) => c.name === initialData.category);
    if (matched) {
      setSelectedCategoryId(matched._id);
      dispatch(getSubCategories(matched._id));
    }
  }, [isOpen, initialData, categories, dispatch]);

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
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          variantName: '',
          color: '',
          storage: '',
          ram: '',
          condition: '',
          price: '',
          stock: '',
        },
      ],
    }));
  };

  const removeVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
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

  const filteredStandardProducts = useMemo(() => {
    const term = standardSearch.trim().toLowerCase();
    return (existingProducts || [])
      .filter((p) => p?._id && p._id !== initialData?._id)
      .filter((p) => {
        if (!term) return true;
        const name = String(p.productName || '').toLowerCase();
        const category = String(p.category || '').toLowerCase();
        return name.includes(term) || category.includes(term);
      })
      .slice(0, 8);
  }, [existingProducts, standardSearch, initialData]);

  const existingImageUrls = useMemo(
    () => (Array.isArray(form.existingImages) ? form.existingImages : []),
    [form.existingImages],
  );

  const selectedImageUrls = useMemo(
    () => form.images.map((img) => URL.createObjectURL(img)),
    [form.images],
  );

  const addVariantFromProduct = (product) => {
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
              {mode === 'edit' ? 'Edit Listing' : 'Add New Listing'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Rental listing form</p>
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
          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-orange-300 text-orange-600 bg-orange-50 text-center py-2 text-sm font-medium">
              Add Rental
            </div>
            <div className="rounded-xl border text-gray-400 bg-gray-50 text-center py-2 text-sm">
              Sales Configuration (Later)
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-gray-900 mb-2">Basic Information</p>
          </div>
          <input
            name="productName"
            value={form.productName}
            onChange={handleChange}
            placeholder="Product name"
            className="border rounded-lg px-3 py-2"
            required
          />
          <input type="hidden" name="type" value="Rental" />
          <div className="border rounded-lg px-3 py-2 bg-gray-50 text-sm text-gray-600">
            Listing Type: <span className="font-medium text-gray-900">Rental</span>
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
          <input
            name="shortDescription"
            value={form.shortDescription}
            onChange={handleChange}
            placeholder="Short description"
            type="text"
            className="border rounded-lg px-3 py-2 md:col-span-2"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Detailed description"
            className="border rounded-lg px-3 py-2 md:col-span-2 min-h-[90px]"
          />
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price (example: 1499/month or 24999)"
            type="text"
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="Stock"
            type="number"
            className="border rounded-lg px-3 py-2"
            required
          />
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option>Active</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>

          <input
            name="images"
            onChange={handleChange}
            type="file"
            accept="image/*"
            multiple
            className="border rounded-lg px-3 py-2 md:col-span-2"
            required={mode === 'create' && form.images.length === 0}
          />
          <div className="md:col-span-2 -mt-2 text-xs text-gray-500">
            Upload up to 5 product images. Existing images stay until removed.
          </div>
          {mode === 'edit' && existingImageUrls.length > 0 ? (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-600 mb-2">Current product images</p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {existingImageUrls.map((src, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className="h-20 rounded-lg border bg-gray-50 overflow-hidden relative"
                  >
                    <img src={src} alt={`existing-${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs"
                      aria-label="Remove existing image"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selectedImageUrls.length > 0 ? (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-600 mb-2">New selected images</p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {selectedImageUrls.map((src, idx) => (
                  <div
                    key={`selected-${idx}`}
                    className="h-20 rounded-lg border bg-gray-50 overflow-hidden relative"
                  >
                    <img src={src} alt={`selected-${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs"
                      aria-label="Remove selected image"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
                  onChange={(e) => handleSpecChange(field.key, e.target.value)}
                  placeholder={field.label}
                  className="border rounded-lg px-3 py-2"
                />
              ))}
            </div>
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">
                Search Standard Listed Products (Variants)
              </p>
              <button
                type="button"
                onClick={addVariant}
                className="px-3 py-1.5 rounded-lg border text-xs text-gray-700 hover:bg-gray-50"
              >
                + Add Variant
              </button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={standardSearch}
                onChange={(e) => setStandardSearch(e.target.value)}
                placeholder="Search standard listed products"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {filteredStandardProducts.length > 0 ? (
              <div className="mb-3 border rounded-xl overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {filteredStandardProducts.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.productName}</p>
                        <p className="text-xs text-gray-500">
                          {p.category} • {p.price}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addVariantFromProduct(p)}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              {form.variants.map((variant, index) => (
                <div key={`${index}-${variant.variantName}`} className="border rounded-xl p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={variant.variantName}
                      onChange={(e) => updateVariant(index, 'variantName', e.target.value)}
                      placeholder="Variant name"
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      placeholder="Color"
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      value={variant.storage}
                      onChange={(e) => updateVariant(index, 'storage', e.target.value)}
                      placeholder="Storage"
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      value={variant.ram}
                      onChange={(e) => updateVariant(index, 'ram', e.target.value)}
                      placeholder="RAM"
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      value={variant.condition}
                      onChange={(e) => updateVariant(index, 'condition', e.target.value)}
                      placeholder="Condition"
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', e.target.value)}
                      placeholder="Variant price"
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
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
            <p className="text-sm font-semibold text-gray-900 mb-2">Rental Configuration</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {form.rentalConfigurations.map((cfg, idx) => (
                <div key={`${cfg.months}-${idx}`} className="border rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-2">{cfg.months} Months</p>
                  <input
                    type="text"
                    value={cfg.label}
                    onChange={(e) => updateRentalConfig(idx, 'label', e.target.value)}
                    placeholder="Label"
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                  />
                  <input
                    type="number"
                    value={cfg.pricePerDay}
                    onChange={(e) => updateRentalConfig(idx, 'pricePerDay', e.target.value)}
                    placeholder="Pricing per day"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Refundable Deposit</p>
            <input
              type="number"
              value={form.refundableDeposit}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, refundableDeposit: e.target.value }))
              }
              placeholder="Enter refundable deposit amount"
              className="w-full md:w-1/2 border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Logistics & Verification</p>
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
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            >
              {mode === 'edit' ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductAddModal;
