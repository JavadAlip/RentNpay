'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGetAllOrders } from '@/service/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const badgeClassByType = (type) => {
  const t = String(type || '').toLowerCase();
  if (t.includes('rent') || t.includes('rental')) {
    return 'bg-blue-50 text-blue-600 border-blue-100';
  }
  if (t.includes('service')) {
    return 'bg-rose-50 text-rose-600 border-rose-100';
  }
  if (t.includes('used')) {
    return 'bg-gray-100 text-gray-600 border-gray-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

export default function Cart() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCart, setSelectedCart] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!token) {
        setError('Please login again to continue.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await apiGetAllOrders(token);
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setOrders([]);
        setError(err?.response?.data?.message || 'Failed to load cart data.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const cartRows = useMemo(() => {
    return (orders || []).map((o, idx) => {
      const firstItem = Array.isArray(o?.products) ? o.products[0] : null;
      const product = firstItem?.product || {};
      const quantity = Number(firstItem?.quantity || 0);
      const pricePerDay = Number(firstItem?.pricePerDay || 0);
      const duration = Number(o?.rentalDuration || 0);
      const amount = Math.max(0, quantity * pricePerDay * duration);

      return {
        id: o?._id || String(idx),
        srNo: idx + 1,
        customerName: String(o?.user?.fullName || o?.name || 'Customer'),
        customerPhone: String(o?.phone || o?.user?.phone || '').trim(),
        customerEmail: String(o?.user?.emailAddress || '').trim(),
        cartDate: o?.createdAt
          ? new Date(o.createdAt).toLocaleDateString('en-GB')
          : '-',
        productType: String(product?.type || 'For Rent'),
        productName: String(product?.productName || 'Product'),
        productImage: product?.image || product?.images?.[0] || '',
        originalPrice: Number(product?.price || 0),
        deposit: Number(product?.refundableDeposit || 0),
        shipping: Number(firstItem?.shippingCharges || 0),
        amount,
      };
    });
  }, [orders]);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return cartRows;
    return cartRows.filter((r) => {
      return (
        r.customerName.toLowerCase().includes(term) ||
        r.productName.toLowerCase().includes(term) ||
        r.productType.toLowerCase().includes(term)
      );
    });
  }, [cartRows, query]);

  const stats = useMemo(() => {
    const activeCarts = filteredRows.length;
    const totalCartValue = filteredRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const avgCartValue = activeCarts ? Math.round(totalCartValue / activeCarts) : 0;
    return { activeCarts, totalCartValue, avgCartValue };
  }, [filteredRows]);

  const detail = useMemo(() => {
    if (!selectedCart) return null;
    const productAmount = Number(selectedCart.amount || 0);
    const deposit = Number(selectedCart.deposit || 0);
    const shipping = Number(selectedCart.shipping || 0);
    return {
      ...selectedCart,
      productAmount,
      deposit,
      shipping,
      totalQuote: productAmount + deposit + shipping,
      initials: String(selectedCart.customerName || 'U')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase() || '')
        .join('') || 'U',
    };
  }, [selectedCart]);

  return (
    <main className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Shopping Cart</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage customer shopping carts across the platform
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-blue-100 p-4">
              <p className="text-xs text-gray-500">Active Carts</p>
              <p className="text-4xl font-semibold text-blue-600 mt-1">
                {stats.activeCarts}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100 p-4">
              <p className="text-xs text-gray-500">Total Cart Value</p>
              <p className="text-4xl font-semibold text-emerald-600 mt-1">
                {money(stats.totalCartValue)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-violet-100 p-4">
              <p className="text-xs text-gray-500">Avg. Cart Value</p>
              <p className="text-4xl font-semibold text-violet-600 mt-1">
                {money(stats.avgCartValue)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer name or product..."
              className="w-full sm:max-w-md px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-gray-500">
                    <th className="px-4 py-3 text-left font-medium">SR. NO.</th>
                    <th className="px-4 py-3 text-left font-medium">CUSTOMER INFO</th>
                    <th className="px-4 py-3 text-left font-medium">CART DATE</th>
                    <th className="px-4 py-3 text-left font-medium">PRODUCT TYPE</th>
                    <th className="px-4 py-3 text-left font-medium">PRODUCT NAME</th>
                    <th className="px-4 py-3 text-right font-medium">CART AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 cursor-pointer hover:bg-gray-50/80"
                      onClick={() => setSelectedCart(row)}
                    >
                      <td className="px-4 py-3 text-gray-700">{row.srNo}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{row.customerName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {row.customerPhone || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.cartDate}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs rounded-full border ${badgeClassByType(
                            row.productType,
                          )}`}
                        >
                          {row.productType || 'For Rent'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.productImage ? (
                            <img
                              src={row.productImage}
                              alt=""
                              className="w-8 h-8 rounded-md object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-gray-100 border border-gray-200" />
                          )}
                          <span className="text-gray-800">{row.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {money(row.amount)}
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No cart records found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between text-sm font-semibold">
              <span>GRAND TOTAL</span>
              <span>{money(stats.totalCartValue)}</span>
            </div>
          </div>
        </>
      )}

      {detail ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelectedCart(null)}
            aria-label="Close cart detail"
          />
          <aside className="absolute right-0 top-0 h-full w-full sm:w-[540px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Cart Detail</h3>
                <p className="text-sm text-gray-500">
                  Review and manage abandoned cart recovery
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCart(null)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Customer Overview
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
                    {detail.initials}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{detail.customerName}</p>
                    <p className="text-xs text-gray-500">{detail.customerPhone || '—'}</p>
                    <p className="text-xs text-gray-500">
                      {detail.customerEmail || 'no-email@rentnpay.com'}
                    </p>
                  </div>
                </div>
                <a
                  href={detail.customerPhone ? `tel:${detail.customerPhone}` : '#'}
                  onClick={(e) => {
                    if (!detail.customerPhone) e.preventDefault();
                  }}
                  className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 text-sm font-medium"
                >
                  Call Customer
                </a>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Item Deep Dive
                </p>
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                  {detail.productImage ? (
                    <img
                      src={detail.productImage}
                      alt={detail.productName}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100" />
                  )}
                </div>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{detail.productName}</p>
                <span
                  className={`mt-2 inline-flex px-2.5 py-1 text-xs rounded-full border ${badgeClassByType(
                    detail.productType,
                  )}`}
                >
                  {detail.productType || 'For Rent'}
                </span>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                    <p className="text-[11px] text-gray-500 uppercase">Original Price</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">
                      {money(detail.originalPrice || detail.productAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-[11px] text-gray-500 uppercase">Current Cart Price</p>
                    <p className="text-xl font-semibold text-emerald-700 mt-1">
                      {money(detail.productAmount)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Financial Breakdown
                </p>
                <div className="rounded-xl border border-gray-200 overflow-hidden divide-y">
                  <div className="px-3 py-2.5 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Product Amount</span>
                    <span className="font-semibold text-gray-900">{money(detail.productAmount)}</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between text-sm bg-orange-50">
                    <span className="text-orange-700">Security Deposit (Refundable)</span>
                    <span className="font-semibold text-orange-700">{money(detail.deposit)}</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimated Shipping</span>
                    <span className="font-semibold text-gray-900">
                      {detail.shipping > 0 ? money(detail.shipping) : 'FREE'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total Full Quote</span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {money(detail.totalQuote)}
                  </span>
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

