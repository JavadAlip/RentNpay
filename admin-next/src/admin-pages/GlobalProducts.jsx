'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGetAllAdminProducts } from '@/service/api';
import {
  ChevronDown,
  EllipsisVertical,
  Search,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';

const rupee = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const parsePrice = (raw) => {
  const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};
const STATUS_STYLES = {
  live: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  flagged: 'bg-rose-100 text-rose-700',
};
const toTitleCase = (val = '') =>
  String(val)
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
const resolveListingStatus = (product = {}) => {
  const raw =
    product?.listingStatus ||
    product?.status ||
    product?.approvalStatus ||
    product?.verificationStatus ||
    '';
  const normalized = String(raw).toLowerCase();
  if (normalized.includes('flag')) return 'flagged';
  if (
    normalized.includes('pending') ||
    normalized.includes('review') ||
    normalized.includes('draft')
  )
    return 'pending';
  return 'live';
};
const isProductLiveOnStorefront = (product = {}) => {
  if (!product || product.isAdminApproved === false) return false;
  if (String(product.submissionStatus || '').trim().toLowerCase() !== 'published')
    return false;
  if (product.adminListingEnabled === false) return false;
  if (product.vendorListingEnabled === false) return false;
  return true;
};
const getVendorName = (product = {}) =>
  [
    product?.vendorName,
    product?.storeName,
    product?.shopNameForVerification,
    product?.vendor?.storeName,
    product?.vendor?.businessName,
    product?.vendor?.shopNameForVerification,
    product?.vendor?.fullName,
    product?.vendor?.name,
    product?.vendorId?.storeName,
    product?.vendorId?.businessName,
    product?.vendorId?.shopNameForVerification,
    product?.vendorId?.fullName,
    product?.vendorId?.name,
    product?.vendorId?.vendorName,
    product?.vendorId?.storeManagement?.stores?.[0]?.storeName,
    product?.vendorId?.kyc?.storeManagement?.stores?.[0]?.storeName,
    product?.vendor?.storeManagement?.stores?.[0]?.storeName,
    product?.vendor?.kyc?.storeManagement?.stores?.[0]?.storeName,
    product?.owner?.storeName,
    product?.owner?.businessName,
    product?.owner?.fullName,
  ].find((v) => String(v || '').trim()) || 'Unknown Vendor';

export default function GlobalProducts() {
  const pageSize = 10;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [page, setPage] = useState(1);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    const loadProducts = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const productsRes = await apiGetAllAdminProducts(token, 'limit=200');
        const prods = productsRes.data?.products || [];
        setProducts(prods.filter((p) => isProductLiveOnStorefront(p)));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [token]);

  const vendorOptions = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((p) => getVendorName(p)).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return unique;
  }, [products]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const vendor = getVendorName(p);
      const name = String(p.productName || '').toLowerCase();
      const sku = String(
        p.sku || p.productCode || p._id?.slice(-8)?.toUpperCase() || '',
      ).toLowerCase();
      const matchesText = !q || name.includes(q) || sku.includes(q);
      const matchesVendor =
        vendorFilter === 'all' ||
        vendor.toLowerCase() === String(vendorFilter).toLowerCase();
      return matchesText && matchesVendor;
    });
  }, [products, search, vendorFilter]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [search, vendorFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Global Product Inventory
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage all product listings across vendors
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product Name or SKU"
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-700"
          >
            <option value="all">Filter by Vendor</option>
            {vendorOptions.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        {/* <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <MapPin className="h-4 w-4 text-gray-500" />
          Mumbai
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button> */}
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Product ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Product Details
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Vendor Name
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Price/Rent
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Listing Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((product) => {
                  const status = resolveListingStatus(product);
                  const statusClass =
                    STATUS_STYLES[status] || STATUS_STYLES.live;
                  const productId = `PRD-${String(product._id || '')
                    .slice(-3)
                    .toUpperCase()}`;
                  const sku =
                    product.sku ||
                    product.productCode ||
                    `SKU-${String(product._id || '')
                      .slice(-6)
                      .toUpperCase()}`;
                  return (
                    <tr
                      key={product._id}
                      className="border-t border-gray-100 text-gray-700 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {productId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt=""
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {product.productName}
                            </p>
                            <p className="text-xs text-gray-500">{sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {toTitleCase(product.category || 'General')}
                      </td>
                      <td className="px-4 py-3">{getVendorName(product)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {rupee(parsePrice(product.price))}/mo
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}
                        >
                          {toTitleCase(
                            status === 'pending' ? 'pending review' : status,
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 flex items-center gap-1.5"
                          >
                            <Eye size={14} />
                            View Listing
                          </button>
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!pagedRows.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      No products matched your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {pagedRows.map((product) => {
              const status = resolveListingStatus(product);
              const statusClass = STATUS_STYLES[status] || STATUS_STYLES.live;
              return (
                <div
                  key={product._id}
                  className="rounded-xl border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={product.image}
                        alt=""
                        className="h-11 w-11 rounded-md object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.sku || product.productCode || product._id}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${statusClass}`}
                    >
                      {toTitleCase(
                        status === 'pending' ? 'pending review' : status,
                      )}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <p>Vendor: {getVendorName(product)}</p>
                    <p>
                      Category: {toTitleCase(product.category || 'General')}
                    </p>
                    <p className="col-span-2 font-semibold text-gray-900">
                      Price: {rupee(parsePrice(product.price))}/mo
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600"
                  >
                    View Listing
                  </button>
                </div>
              );
            })}
          </div>

          {rows.length > 0 ? (
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, rows.length)} of {rows.length}{' '}
                products
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-200 px-3 py-1 text-gray-500 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="rounded-md bg-orange-500 px-2.5 py-1 text-white">
                  {currentPage}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-200 px-3 py-1 text-gray-500 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
