'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGetMyOrders } from '@/lib/api';

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-IN');
}

function normalizeStatus(status) {
  return String(status || '').toLowerCase();
}

function statusBadgeClass(status) {
  const s = normalizeStatus(status);
  if (s === 'delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'cancelled') return 'bg-red-50 text-red-600 border-red-200';
  if (s === 'pending') return 'bg-gray-50 text-gray-700 border-gray-200';
  if (s === 'confirmed') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s === 'shipped') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiGetMyOrders()
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        setOrders([]);
        setError(err.response?.data?.message || 'Failed to load orders.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const id = String(o._id || '').toLowerCase();
      const firstTitle = String(
        o.products?.[0]?.product?.productName ||
          o.products?.[0]?.product?.title ||
          '',
      ).toLowerCase();
      return id.includes(q) || firstTitle.includes(q);
    });
  }, [orders, query]);

  return (
    <div className="min-h-screen bg-[#F4F6FB] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing orders placed by your account.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Order ID or item name"
            className="w-full outline-none text-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg font-medium">No orders yet.</p>
            <p className="text-gray-400 text-sm mt-2">
              Browse products and place your first order.
            </p>
            <div className="mt-5">
              <Link
                href="/products"
                className="px-5 py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const firstItem = order.products?.[0];
              const product = firstItem?.product;
              const img = product?.image;
              const title =
                product?.productName || product?.title || 'Item';
              const total = (order.products || []).reduce(
                (sum, it) =>
                  sum +
                  Number(it.pricePerDay || 0) *
                    Number(it.quantity || 0) *
                    Number(order.rentalDuration || 0),
                0,
              );

              return (
                <div
                  key={order._id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : ''}
                      </p>
                      <p className="font-semibold text-gray-900">
                        Order {String(order._id || '').slice(-8) || order._id}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${statusBadgeClass(order.status)}`}
                    >
                      {order.status || 'pending'}
                    </span>
                  </div>

                  <div className="p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Duration: {order.rentalDuration} days
                      </p>
                      <p className="text-orange-500 font-semibold text-sm mt-2">
                        Total: ₹{formatMoney(total)}
                      </p>
                      {order.address ? (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          Deliver to: {order.address}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href="/profile"
                        className="text-xs text-orange-500 hover:underline font-medium"
                      >
                        View in profile
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

