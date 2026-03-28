'use client';

import React, { useEffect, useMemo, useState } from 'react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { useDispatch, useSelector } from 'react-redux';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createProduct,
  deleteProduct,
  getMyProducts,
  updateProduct,
} from '../../../redux/slices/productSlice';
import AdminProductAddModal from '@/Admin/Components/Modals/AdminProductAddModal';
import { apiGetMyVendorKyc } from '@/service/api';

const Products = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.product);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
      typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
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
  const lowStock = products.filter((p) => getProductStatus(p) === 'Low Stock').length;
  const outOfStock = products.filter((p) => getProductStatus(p) === 'Out of Stock').length;

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
    payload.append('condition', form.condition || 'Good');
    payload.append('shortDescription', form.shortDescription || '');
    payload.append('description', form.description || '');
    payload.append('specifications', JSON.stringify(form.specifications || {}));
    payload.append('variants', JSON.stringify(form.variants || []));
    payload.append(
      'rentalConfigurations',
      JSON.stringify(form.rentalConfigurations || []),
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
    if (Array.isArray(form.images) && form.images.length) {
      form.images.slice(0, 5).forEach((img) => payload.append('images', img));
    }

    const resultAction = await dispatch(createProduct(payload));
    if (createProduct.fulfilled.match(resultAction)) {
      toast.success('Product added successfully');
      setIsAddModalOpen(false);
    } else {
      toast.error(resultAction.payload || 'Failed to add product');
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
    payload.append('condition', form.condition || 'Good');
    payload.append('shortDescription', form.shortDescription || '');
    payload.append('description', form.description || '');
    payload.append('specifications', JSON.stringify(form.specifications || {}));
    payload.append('variants', JSON.stringify(form.variants || []));
    payload.append(
      'rentalConfigurations',
      JSON.stringify(form.rentalConfigurations || []),
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
              <div>
                <h1 className="text-base md:text-lg font-semibold text-gray-900">
                  Inventory Overview
                </h1>
                <p className="text-xs text-gray-500">
                  Manage your product stock and availability
                </p>
              </div>

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
            </div>

            {kycStatus !== 'approved' ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
                Product creation is locked until KYC is approved by admin. Please
                submit your KYC from{' '}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((p) => {
                      // Use persisted status from DB first so edit changes reflect immediately.
                      const derivedStatus =
                        p.stock === 0
                          ? 'Out of Stock'
                          : p.stock <= 5
                            ? 'Low Stock'
                            : 'Active';
                      const status = p.status || derivedStatus;
                      const statusClass =
                        status === 'Out of Stock'
                          ? 'bg-red-100 text-red-600'
                          : status === 'Low Stock'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600';

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
                                <p className="text-xs text-gray-500">{p.price}</p>
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
                                    ? 'text-amber-500'
                                    : 'text-gray-700'
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

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                onClick={() => handleEditClick(p)}
                                className="text-blue-600 hover:text-blue-800"
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
                          colSpan={7}
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
            {error && (
              <p className="text-sm text-red-500 px-1">
                {error}
              </p>
            )}
          </div>
        </main>
      </div>

      <AdminProductAddModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        mode={editingProduct ? 'edit' : 'create'}
        initialData={editingProduct}
        existingProducts={products}
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
