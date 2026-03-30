'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { apiGetWishlistAnalytics } from '@/service/api';

const stockBadgeClass = (stock) =>
  Number(stock || 0) > 0
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

export default function Wishlist() {
  const [data, setData] = useState({
    summary: {
      totalWishlistedItems: 0,
      mostWishlistedCategory: '—',
      mostWishlistedCategoryCount: 0,
      topWishlistUsers: 0,
    },
    topProducts: [],
    topUsers: [],
  });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGetWishlistAnalytics(token)
      .then((res) => {
        setData(res.data || data);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load wishlist analytics.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return data.topProducts || [];
    return (data.topProducts || []).filter((p) => {
      return (
        String(p.productName || '')
          .toLowerCase()
          .includes(term) ||
        String(p.vendorName || '')
          .toLowerCase()
          .includes(term)
      );
    });
  }, [query, data.topProducts]);

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Global Wishlist Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track trending products, customer preferences, and conversion opportunities
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-9 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Total Wishlisted Items</p>
                <p className="text-4xl font-semibold text-gray-900 mt-1">
                  {Number(data.summary.totalWishlistedItems || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-400 mt-1">Across all products</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Most Wishlisted Category</p>
                <p className="text-4xl font-semibold text-gray-900 mt-1">
                  {data.summary.mostWishlistedCategory || '—'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {data.summary.mostWishlistedCategoryCount || 0} wishlist entries
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Top Wishlist Users</p>
                <p className="text-4xl font-semibold text-gray-900 mt-1">
                  {Number(data.summary.topWishlistUsers || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-400 mt-1">Most active wishlist customers</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Trending Wishlisted Products</h2>
                <button className="px-3 py-1.5 rounded-lg border text-sm text-gray-600">
                  Export
                </button>
              </div>
              <div className="p-4 border-b border-gray-100">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products or vendors..."
                  className="w-full sm:max-w-md px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">PRODUCT DETAILS</th>
                      <th className="px-4 py-3 text-left font-medium">TOTAL WISHLISTS</th>
                      <th className="px-4 py-3 text-left font-medium">CATEGORY</th>
                      <th className="px-4 py-3 text-left font-medium">PRICE/RENT</th>
                      <th className="px-4 py-3 text-left font-medium">VENDOR</th>
                      <th className="px-4 py-3 text-left font-medium">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={String(p.productId)} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.productImage || 'https://placehold.co/80x80/e5e7eb/6b7280?text=IMG'}
                              alt={p.productName}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{p.productName}</p>
                              <p className="text-xs text-gray-500">Monthly</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-gray-900 font-semibold">
                            <Heart size={14} className="text-rose-500 fill-rose-500" />
                            {p.totalWishlists}
                          </span>
                        </td>
                        <td className="px-4 py-3">{p.category || '—'}</td>
                        <td className="px-4 py-3">{p.price || '—'}</td>
                        <td className="px-4 py-3">{p.vendorName || 'Vendor'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${stockBadgeClass(
                              p.stock,
                            )}`}
                          >
                            {Number(p.stock || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No wishlist products found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900">Top Wishlist Users</h3>
              <p className="text-xs text-gray-500 mb-3">Most active wishlist customers</p>
              <div className="space-y-2">
                {(data.topUsers || []).slice(0, 5).map((u, idx) => (
                  <div key={String(u.userId)} className="border rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-gray-900">
                        #{idx + 1} {u.fullName}
                      </p>
                      <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <Heart size={12} className="text-gray-400 fill-gray-400" />
                        {u.totalWishlists}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{u.emailAddress}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-orange-300 p-4">
              <h3 className="text-base font-semibold text-gray-900">Campaign Actions</h3>
              <p className="text-xs text-gray-500 mb-3">Drive conversions</p>
              <div className="space-y-2">
                <button className="w-full rounded-xl bg-orange-500 text-white px-3 py-2.5 text-sm font-medium">
                  Create Discount for Wishlisted Items
                </button>
                <button className="w-full rounded-xl border border-orange-200 text-orange-700 px-3 py-2.5 text-sm font-medium">
                  Create Flash Sale
                </button>
                <button className="w-full rounded-xl border border-orange-200 text-orange-700 px-3 py-2.5 text-sm font-medium">
                  Send Push Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

