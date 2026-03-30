'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { apiGetMyWishlist, apiToggleWishlist } from '@/lib/api';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadWishlist = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetMyWishlist();
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (err) {
      setItems([]);
      setError(err?.response?.data?.message || 'Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const total = useMemo(() => items.length, [items]);

  const removeFromWishlist = async (productId) => {
    setBusyId(String(productId));
    try {
      await apiToggleWishlist(productId);
      setItems((prev) => prev.filter((p) => String(p._id) !== String(productId)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update wishlist.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-sm text-gray-500 mt-1">
            Save products you love and come back anytime.
          </p>
        </div>
        <span className="text-sm text-gray-500">{total} item(s)</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-gray-700 font-medium">No wishlist products yet.</p>
          <p className="text-sm text-gray-500 mt-1">
            Tap the heart icon on products to save them here.
          </p>
          <Link
            href="/products"
            className="inline-flex mt-4 rounded-xl bg-orange-500 px-4 py-2 text-white text-sm font-medium hover:bg-orange-600"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((p) => (
            <div
              key={p._id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition"
            >
              <div className="relative">
                <img
                  src={
                    p.image ||
                    p.images?.[0] ||
                    'https://placehold.co/600x400/e5e7eb/6b7280?text=IMG'
                  }
                  alt={p.productName}
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFromWishlist(p._id)}
                  disabled={busyId === String(p._id)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center disabled:opacity-60"
                  aria-label="Remove from wishlist"
                >
                  <Heart size={18} className="text-red-500 fill-red-500" />
                </button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-500">{p.category || 'Product'}</p>
                <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">
                  {p.productName}
                </h3>
                <p className="mt-2 font-semibold text-gray-900">{p.price || '—'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Stock: {Number(p.stock || 0)}</span>
                  <Link
                    href={`/rent-product-details/${p._id}`}
                    className="text-sm text-orange-600 font-medium hover:underline"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

