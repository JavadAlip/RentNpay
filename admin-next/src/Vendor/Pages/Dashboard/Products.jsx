'use client';

import React, { useEffect, useMemo, useState } from 'react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { useDispatch, useSelector } from 'react-redux';
import { Pencil, Trash2, Package, AlertTriangle, CircleX } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createProduct,
  deleteProduct,
  getMyProducts,
  patchVendorListingVisibility,
  updateProduct,
} from '../../../redux/slices/productSlice';
import VendorProductAddModal from '../../Components/Modals/VendorProductAddModal';
import VendorManualProductModal from '../../Components/Modals/VendorManualProductModal';
import { apiGetMyVendorKyc } from '@/service/api';

function formatInrAmount(n) {
  if (!Number.isFinite(n) || n <= 0) return '';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

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

function tierRentAmount(tier) {
  const n = (k) => {
    const v = Number(String(tier?.[k] ?? '').replace(/,/g, ''));
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
  return n('customerRent') || n('pricePerDay') || n('vendorRent') || 0;
}

function isProductLiveOnStorefront(p) {
  if (!p || p.isAdminApproved === false) return false;
  if (String(p.submissionStatus || '').trim() !== 'published') return false;
  if (p.adminListingEnabled === false) return false;
  if (p.vendorListingEnabled === false) return false;
  return true;
}

/** Subtitle under product name: 3d / 3mo from rental tiers, else legacy `price` */
function getInventoryPriceLabel(product) {
  if (product?.type && String(product.type) !== 'Rental') {
    const raw = product?.price;
    if (
      raw != null &&
      String(raw).trim() !== '' &&
      String(raw).trim() !== '0'
    ) {
      return String(raw).trim();
    }
    return '—';
  }

  const configs = pickProductRentalConfigurations(product);
  if (configs.length) {
    const isDay = configs.some((c) => c?.periodUnit === 'day');
    if (isDay) {
      const tier =
        configs.find((c) => c?.periodUnit === 'day' && Number(c?.days) === 3) ||
        configs.find((c) => c?.periodUnit === 'day');
      if (tier) {
        const amt = tierRentAmount(tier);
        const d = Number(tier?.days) > 0 ? Number(tier.days) : 3;
        const f = formatInrAmount(amt);
        if (f) return d === 3 ? `₹${f} / 3d` : `₹${f} / ${d}d`;
      }
    } else {
      const tier =
        configs.find(
          (c) => c?.periodUnit !== 'day' && Number(c?.months) === 3,
        ) ||
        configs.find(
          (c) =>
            c?.periodUnit === 'month' ||
            (!c?.periodUnit && Number(c?.months) > 0),
        ) ||
        configs.find((c) => Number(c?.months) > 0);
      if (tier) {
        const amt = tierRentAmount(tier);
        const m = Number(tier?.months) > 0 ? Number(tier.months) : 3;
        const f = formatInrAmount(amt);
        if (f) return m === 3 ? `₹${f} / 3mo` : `₹${f} / ${m}mo`;
      }
    }
  }

  const raw = product?.price;
  const s = raw != null ? String(raw).trim() : '';
  if (s && s !== '0') {
    if (/[₹]|rs\.?|\/mo|\/month|\/d|\/day/i.test(s)) return s;
    return `₹${s}/mo`;
  }
  return '—';
}

const Products = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.product);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualModalDesign, setManualModalDesign] = useState('vendor');
  const [manualListingKind, setManualListingKind] = useState('rental');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [kycLoading, setKycLoading] = useState(true);

  // Fetch products
  useEffect(() => {
    dispatch(getMyProducts());
  }, [dispatch]);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null;
    if (!token) {
      setKycLoading(false);
      return;
    }
    apiGetMyVendorKyc(token)
      .then((res) => {
        setKycStatus(res.data?.kyc?.status || '');
      })
      .catch(() => {
        setKycStatus('');
      })
      .finally(() => setKycLoading(false));
  }, []);

  // Dynamic stats (prefer saved status; fallback to stock-derived status)
  const getProductStatus = (p) => {
    if (p.status) return p.status;
    if (p.stock === 0) return 'Out of Stock';
    if (p.stock <= 5) return 'Low Stock';
    return 'Active';
  };

  const totalProducts = products.length;
  const lowStock = products.filter(
    (p) => getProductStatus(p) === 'Low Stock',
  ).length;
  const outOfStock = products.filter(
    (p) => getProductStatus(p) === 'Out of Stock',
  ).length;

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const name = p.productName?.toLowerCase() || '';
      const category = p.category?.toLowerCase() || '';
      const subCategory = p.subCategory?.toLowerCase() || '';
      return (
        name.includes(term) ||
        category.includes(term) ||
        subCategory.includes(term)
      );
    });
  }, [products, query]);

  const deriveStatusFromStock = (stock) => {
    const s = Number(stock || 0);
    if (s <= 0) return 'Out of Stock';
    if (s <= 5) return 'Low Stock';
    return 'Active';
  };

  const buildProductFormData = (product, overrides = {}) => {
    const next = { ...product, ...overrides };
    const stockNum = Number(next.stock || 0);
    const status = deriveStatusFromStock(stockNum);

    const payload = new FormData();
    payload.append('productName', next.productName || '');
    payload.append('type', next.type || 'Rental');
    payload.append('category', next.category || '');
    payload.append('subCategory', next.subCategory || '');
    payload.append('brand', next.brand || '');
    payload.append('condition', next.condition || 'Brand New');
    payload.append('shortDescription', next.shortDescription || '');
    payload.append('description', next.description || '');
    payload.append('specifications', JSON.stringify(next.specifications || {}));
    payload.append('variants', JSON.stringify(next.variants || []));
    payload.append(
      'rentalConfigurations',
      JSON.stringify(next.rentalConfigurations || []),
    );
    payload.append(
      'salesConfiguration',
      JSON.stringify(next.salesConfiguration || {}),
    );
    payload.append('refundableDeposit', String(next.refundableDeposit || 0));
    payload.append(
      'logisticsVerification',
      JSON.stringify(next.logisticsVerification || {}),
    );
    payload.append(
      'existingImages',
      JSON.stringify(next.images || [next.image].filter(Boolean)),
    );
    payload.append('price', next.price || '');
    payload.append('stock', String(stockNum));
    payload.append('status', status);
    payload.append('submissionStatus', next.submissionStatus || 'draft');
    return payload;
  };

  const handleCreateProduct = async (form) => {
    const autoStatus =
      Number(form.stock) === 0
        ? 'Out of Stock'
        : Number(form.stock) <= 5
          ? 'Low Stock'
          : 'Active';
    const status = form.status || autoStatus;

    const payload = new FormData();
    payload.append('productName', form.productName);
    payload.append('type', form.type);
    payload.append('category', form.category);
    payload.append('subCategory', form.subCategory);
    payload.append('brand', form.brand || '');
    payload.append('condition', form.condition || 'Brand New');
    payload.append('shortDescription', form.shortDescription || '');
    payload.append('description', form.description || '');
    payload.append('specifications', JSON.stringify(form.specifications || {}));
    payload.append('variants', JSON.stringify(form.variants || []));
    payload.append(
      'rentalConfigurations',
      JSON.stringify(form.rentalConfigurations || []),
    );
    payload.append(
      'salesConfiguration',
      JSON.stringify(form.salesConfiguration || {}),
    );
    payload.append('refundableDeposit', String(form.refundableDeposit || 0));
    payload.append(
      'logisticsVerification',
      JSON.stringify(form.logisticsVerification || {}),
    );
    payload.append('existingImages', JSON.stringify(form.existingImages || []));
    payload.append('price', form.price);
    payload.append('stock', String(form.stock));
    payload.append('status', status);
    payload.append('submissionStatus', form.submissionStatus || 'draft');
    if (form.createdVia) {
      payload.append('createdVia', form.createdVia);
    }
    if (form.allowVendorEditRentalPrices !== undefined) {
      payload.append(
        'allowVendorEditRentalPrices',
        String(form.allowVendorEditRentalPrices),
      );
    }
    if (Array.isArray(form.images) && form.images.length) {
      form.images.slice(0, 5).forEach((img) => payload.append('images', img));
    }

    const resultAction = await dispatch(createProduct(payload));
    if (createProduct.fulfilled.match(resultAction)) {
      const sub = form.submissionStatus || 'published';
      toast.success(
        sub === 'draft'
          ? 'Draft saved'
          : 'Product submitted for admin approval',
      );
      setIsAddModalOpen(false);
      return true;
    } else {
      toast.error(resultAction.payload || 'Failed to add product');
      return false;
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleUpdateProduct = async (form) => {
    if (!editingProduct?._id) return;
    const autoStatus =
      Number(form.stock) === 0
        ? 'Out of Stock'
        : Number(form.stock) <= 5
          ? 'Low Stock'
          : 'Active';
    const status = form.status || autoStatus;

    const payload = new FormData();
    payload.append('productName', form.productName);
    payload.append('type', form.type);
    payload.append('category', form.category);
    payload.append('subCategory', form.subCategory);
    payload.append('brand', form.brand || '');
    payload.append('condition', form.condition || 'Brand New');
    payload.append('shortDescription', form.shortDescription || '');
    payload.append('description', form.description || '');
    payload.append('specifications', JSON.stringify(form.specifications || {}));
    payload.append('variants', JSON.stringify(form.variants || []));
    payload.append(
      'rentalConfigurations',
      JSON.stringify(form.rentalConfigurations || []),
    );
    payload.append(
      'salesConfiguration',
      JSON.stringify(form.salesConfiguration || {}),
    );
    payload.append('refundableDeposit', String(form.refundableDeposit || 0));
    payload.append(
      'logisticsVerification',
      JSON.stringify(form.logisticsVerification || {}),
    );
    payload.append('existingImages', JSON.stringify(form.existingImages || []));
    payload.append('price', form.price);
    payload.append('stock', String(form.stock));
    payload.append('status', status);
    payload.append('submissionStatus', form.submissionStatus || 'draft');
    if (form.createdVia) {
      payload.append('createdVia', form.createdVia);
    }
    if (form.allowVendorEditRentalPrices !== undefined) {
      payload.append(
        'allowVendorEditRentalPrices',
        String(form.allowVendorEditRentalPrices),
      );
    }
    if (Array.isArray(form.images) && form.images.length) {
      form.images.slice(0, 5).forEach((img) => payload.append('images', img));
    }

    const resultAction = await dispatch(
      updateProduct({ id: editingProduct._id, formData: payload }),
    );
    if (updateProduct.fulfilled.match(resultAction)) {
      toast.success('Product updated successfully');
      setIsAddModalOpen(false);
      setEditingProduct(null);
    } else {
      toast.error(resultAction.payload || 'Failed to update product');
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) return;
    const resultAction = await dispatch(deleteProduct(deleteTarget._id));
    if (deleteProduct.fulfilled.match(resultAction)) {
      toast.success('Product deleted successfully');
    } else {
      toast.error(resultAction.payload || 'Failed to delete product');
    }
    setDeleteTarget(null);
  };

  const handleToggleActive = async (product) => {
    if (!product.isAdminApproved) {
      toast.info('This listing is pending admin approval.');
      return;
    }
    if (String(product.submissionStatus || '').trim() !== 'published') {
      toast.info('Only published listings can be shown on the website.');
      return;
    }
    const adminOn = product.adminListingEnabled !== false;
    if (!adminOn) {
      toast.info('Admin has turned off this listing on the storefront.');
      return;
    }
    const live = isProductLiveOnStorefront(product);
    const nextVendor = !live;

    const resultAction = await dispatch(
      patchVendorListingVisibility({
        id: product._id,
        vendorListingEnabled: nextVendor,
      }),
    );
    if (patchVendorListingVisibility.fulfilled.match(resultAction)) {
      toast.success(
        nextVendor
          ? 'Product visible on website'
          : 'Product hidden from website',
      );
    } else {
      toast.error(
        resultAction.payload || 'Failed to update product visibility',
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <VendorSidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <VendorTopBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* <div className="flex items-start gap-3">
                <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-[#2563EB] to-[#1E40AF]">
                  <Package className="w-6 h-6 text-white" strokeWidth={1.75} />
                </div>
                <h1 className="text-base md:text-lg font-semibold text-gray-900">
                  Inventory Overview
                </h1>
                <p className="text-xs text-gray-500">
                  Manage your product stock and availability
                </p>
              </div> */}
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-[#2563EB] to-[#1E40AF]">
                  <Package className="w-6 h-6 text-white" strokeWidth={1.75} />
                </div>
                {/* 
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Image
              src={adminCustome}
              alt="admin"
              className="w-6 h-6 object-contain"
            />
          </div> */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                    Inventory Overview
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your product stock and availability
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (kycStatus !== 'approved') {
                      toast.error(
                        'KYC not approved yet. Complete KYC and wait for admin approval.',
                      );
                      return;
                    }
                    setEditingProduct(null);
                    setIsAddModalOpen(true);
                  }}
                  disabled={kycLoading || kycStatus !== 'approved'}
                  className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add New Product
                </button>
                {/* <button
                  type="button"
                  onClick={() => {
                    if (kycStatus !== 'approved') {
                      toast.error(
                        'KYC not approved yet. Complete KYC and wait for admin approval.',
                      );
                      return;
                    }
                    setManualListingKind('sell');
                    setIsManualModalOpen(true);
                  }}
                  disabled={kycLoading || kycStatus !== 'approved'}
                  className="px-4 py-2 rounded-full border border-blue-200 bg-white text-blue-800 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Manual sell listing
                </button> */}
              </div>
            </div>

            {!kycLoading && kycStatus !== 'approved' ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
                Product creation is locked until KYC is approved by admin.
                Please submit your KYC from{' '}
                <a
                  href="/vendor-kyc-verification"
                  className="font-semibold underline"
                >
                  Vendor KYC Verification
                </a>
                .
              </div>
            ) : null}

            {/* Stats */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border p-4">
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-2xl font-semibold">{totalProducts}</p>
              </div>

              <div className="bg-white rounded-2xl border p-4">
                <p className="text-xs text-gray-500">Low Stock</p>
                <p className="text-2xl text-amber-500">{lowStock}</p>
              </div>

              <div className="bg-white rounded-2xl border p-4">
                <p className="text-xs text-gray-500">Out of Stock</p>
                <p className="text-2xl text-red-500">{outOfStock}</p>
              </div>
            </div> */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Products */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">
                    Total Products
                  </p>
                  <div className="p-1.5 bg-[#EFF6FF] rounded-lg">
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                </div>

                <p className="text-3xl font-semibold mt-2 tabular-nums">
                  {totalProducts}
                </p>
              </div>

              {/* Low Stock */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <div className="p-1.5 bg-[#FFF7ED] rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                <p className="text-2xl font-semibold mt-2 text-[#F97316] tabular-nums">
                  {lowStock}
                </p>

                <p className="text-sm mt-2 text-gray-600">items</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-[#F97316] hover:underline"
                  // onClick={() => {
                  //   setTypeFilter('all');
                  //   setQuery('');
                  // }}
                >
                  View list →
                </button>
              </div>

              {/* Out of Stock */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">
                    Out of Stock
                  </p>
                  <div className="p-1.5 bg-[#FEF2F2] rounded-lg">
                    <CircleX className="w-5 h-5 text-red-500" />
                  </div>
                </div>

                <p className="text-2xl font-semibold mt-2 text-[#E7000B] tabular-nums">
                  {outOfStock}
                </p>

                <p className="text-sm mt-2 text-gray-600">items</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-[#E7000B] hover:underline"
                  // onClick={() => {
                  //   setTypeFilter('all');
                  //   setQuery('');
                  // }}
                >
                  View list →
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="px-4 pt-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by product, category, sub-category..."
                  className="w-full md:max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">SubCategory</th>
                      <th className="px-4 py-3 text-left">Stock</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Create type</th>
                      <th className="px-4 py-3 text-left">Active</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((p) => {
                      const status = deriveStatusFromStock(p.stock);
                      const statusClass =
                        status === 'Out of Stock'
                          ? 'bg-red-100 text-red-600'
                          : status === 'Low Stock'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600';
                      const isActiveOnStorefront = isProductLiveOnStorefront(p);
                      const isApprovalPending = p.isAdminApproved === false;
                      const adminListingOn = p.adminListingEnabled !== false;
                      const storefrontToggleDisabled =
                        isApprovalPending ||
                        String(p.submissionStatus || '').trim() !==
                          'published' ||
                        !adminListingOn;
                      const createTypeLabel =
                        p.createdVia === 'template' ? 'automatic' : 'manual';

                      return (
                        <tr key={p._id} className="border-t">
                          {/* Product */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  p.images?.[0] ||
                                  p.image ||
                                  'https://placehold.co/80x80/e5e7eb/6b7280?text=IMG'
                                }
                                alt={p.productName}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium">{p.productName}</p>
                                <p className="text-xs text-gray-500">
                                  {getInventoryPriceLabel(p)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">{p.type}</td>

                          {/* Category */}
                          <td className="px-4 py-3">{p.category}</td>

                          {/* SubCategory */}
                          <td className="px-4 py-3">{p.subCategory}</td>

                          {/* Stock */}
                          <td className="px-4 py-3">
                            <span
                              className={`${
                                p.stock === 0
                                  ? 'text-red-500'
                                  : p.stock <= 5
                                    ? 'text-[#F97316]'
                                    : 'text-black'
                              }`}
                            >
                              {p.stock} Units
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${statusClass}`}
                            >
                              {status}
                            </span>
                          </td>

                          {/* Create type */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700">
                              {createTypeLabel}
                            </span>
                          </td>

                          {/* Active toggle (controls storefront visibility) */}
                          {/* <td className="px-4 py-3">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActiveOnStorefront}
                              aria-disabled={storefrontToggleDisabled}
                              onClick={() => handleToggleActive(p)}
                              className={`relative inline-flex h-6 w-11 rounded-full transition ${
                                isActiveOnStorefront
                                  ? 'bg-emerald-500'
                                  : 'bg-red-500'
                              }`}
                              disabled={storefrontToggleDisabled}
                              title={
                                isApprovalPending
                                  ? 'Pending admin approval'
                                  : String(p.submissionStatus || '').trim() !==
                                      'published'
                                    ? 'Publish listing before showing on website'
                                    : !adminListingOn
                                      ? 'Admin has disabled this listing on the storefront'
                                      : isActiveOnStorefront
                                        ? 'Visible on storefront'
                                        : 'Hidden from storefront'
                              }
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                  isActiveOnStorefront
                                    ? 'translate-x-5 mt-0.5'
                                    : 'translate-x-0.5 mt-0.5'
                                }`}
                              />
                            </button>
                            {isApprovalPending ? (
                              <p className="mt-1 text-[11px] text-amber-600">
                                Pending approval
                              </p>
                            ) : null}
                          </td> */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActiveOnStorefront}
                              aria-disabled={storefrontToggleDisabled}
                              onClick={() => handleToggleActive(p)}
                              className={`relative inline-flex h-6 w-11 rounded-full border border-gray-300 transition ${
                                isActiveOnStorefront
                                  ? 'bg-[#E5E7EB]'
                                  : 'bg-[#FEF2F2]'
                              }`}
                              disabled={storefrontToggleDisabled}
                              title={
                                isApprovalPending
                                  ? 'Pending admin approval'
                                  : String(p.submissionStatus || '').trim() !==
                                      'published'
                                    ? 'Publish listing before showing on website'
                                    : !adminListingOn
                                      ? 'Admin has disabled this listing on the storefront'
                                      : isActiveOnStorefront
                                        ? 'Visible on storefront'
                                        : 'Hidden from storefront'
                              }
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full shadow transition mt-0.5 ${
                                  isActiveOnStorefront
                                    ? 'translate-x-5 bg-[#0F8A42]'
                                    : 'translate-x-0.5 bg-[#FF0000]'
                                }`}
                              />
                            </button>

                            {isApprovalPending ? (
                              <p className="mt-1 text-[11px] text-amber-600">
                                Pending approval
                              </p>
                            ) : null}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                onClick={() => handleEditClick(p)}
                                className="text-gray-600 hover:text-gray-800"
                                title="Edit product"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && filteredProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="p-4 text-xs text-gray-500">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>
            {error && <p className="text-sm text-red-500 px-1">{error}</p>}
          </div>
        </main>
      </div>

      <VendorProductAddModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        mode={editingProduct ? 'edit' : 'create'}
        initialData={editingProduct}
        onOpenManualProduct={() => {
          setIsAddModalOpen(false);
          setManualModalDesign('admin');
          setManualListingKind('rental');
          setIsManualModalOpen(true);
        }}
      />

      <VendorManualProductModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setManualModalDesign('vendor');
          setManualListingKind('rental');
        }}
        onSubmit={async (form) => {
          const ok = await handleCreateProduct(form);
          if (ok) {
            setIsManualModalOpen(false);
            setManualListingKind('rental');
          }
        }}
        designMode={manualModalDesign}
        listingKind={manualListingKind}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Product
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-medium text-gray-700">
                  {deleteTarget.productName}
                </span>
                ?
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
