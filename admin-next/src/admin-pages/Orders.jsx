'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGetAllOrders } from '@/service/api';

const PAGE_SIZE = 15;

const tabs = [
  'Processing',
  'Dispatched',
  'In Transit',
  'Cancelled',
  'Delivered',
  'Completed',
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const mapTabToStatuses = (tab) => {
  if (tab === 'Processing') return ['pending', 'confirmed'];
  if (tab === 'Dispatched') return ['shipped'];
  if (tab === 'In Transit') return ['shipped'];
  if (tab === 'Cancelled') return ['cancelled'];
  if (tab === 'Delivered') return ['delivered'];
  if (tab === 'Completed') return ['completed'];
  return [];
};

function statusLabel(raw) {
  const s = String(raw || 'pending').toLowerCase();
  const map = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[s] || s;
}

function statusBadgeClass(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'pending') return 'bg-amber-50 text-amber-900 border-amber-200';
  if (s === 'confirmed') return 'bg-sky-50 text-sky-900 border-sky-200';
  if (s === 'shipped') return 'bg-indigo-50 text-indigo-900 border-indigo-200';
  if (s === 'delivered') return 'bg-emerald-50 text-emerald-900 border-emerald-200';
  if (s === 'completed') return 'bg-teal-50 text-teal-900 border-teal-200';
  if (s === 'cancelled') return 'bg-red-50 text-red-800 border-red-200';
  return 'bg-gray-50 text-gray-800 border-gray-200';
}

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Processing');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

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
      setOrders(res.data || []);
    } catch (err) {
      setOrders([]);
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const normalizedOrders = useMemo(
    () =>
      (orders || []).map((o) => {
        const amount = (o.products || []).reduce(
          (s, i) =>
            s +
            Number(i.pricePerDay || 0) *
              Number(i.quantity || 0) *
              Number(o.rentalDuration || 0),
          0,
        );
        const lines = (o.products || []).map((i) => {
          const p = i.product;
          const name =
            p && typeof p === 'object'
              ? p.productName || p.title || 'Item'
              : 'Item';
          return `${name} ×${Number(i.quantity || 1)}`;
        });
        const primary = o.products?.[0]?.product;
        const productImage =
          primary && typeof primary === 'object' ? primary.image || '' : '';
        return {
          ...o,
          amount,
          displayId: `ORD-${String(o._id).slice(-3).toUpperCase()}`,
          customerName: o.user?.fullName || o.name || '-',
          customerEmail: o.user?.emailAddress || '',
          productLines: lines.length ? lines : ['—'],
          productImage,
        };
      }),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allowed = mapTabToStatuses(activeTab);
    return normalizedOrders.filter((o) => {
      const tabMatch = allowed.length ? allowed.includes(String(o.status)) : true;
      if (!tabMatch) return false;
      if (!q) return true;
      const lineMatch = (o.productLines || []).some((l) =>
        String(l).toLowerCase().includes(q),
      );
      return (
        String(o.displayId).toLowerCase().includes(q) ||
        String(o.customerName).toLowerCase().includes(q) ||
        String(o.customerEmail || '').toLowerCase().includes(q) ||
        lineMatch
      );
    });
  }, [normalizedOrders, activeTab, query]);

  const tabCounts = useMemo(() => {
    const list = normalizedOrders;
    const shipped = list.filter((x) => String(x.status) === 'shipped').length;
    return {
      Processing: list.filter((x) =>
        ['pending', 'confirmed'].includes(String(x.status)),
      ).length,
      Dispatched: shipped,
      'In Transit': shipped,
      Cancelled: list.filter((x) => String(x.status) === 'cancelled').length,
      Delivered: list.filter((x) => String(x.status) === 'delivered').length,
      Completed: list.filter((x) => String(x.status) === 'completed').length,
    };
  }, [normalizedOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const processing = normalizedOrders.filter((o) =>
      ['pending', 'confirmed'].includes(String(o.status)),
    ).length;
    const totalRevenue = normalizedOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const averageOrder = normalizedOrders.length
      ? Math.round(totalRevenue / normalizedOrders.length)
      : 0;
    const urgentActions = normalizedOrders.filter((o) => {
      const isOpen = !['completed', 'cancelled'].includes(String(o.status));
      if (!isOpen) return false;
      const ageMs = Date.now() - new Date(o.createdAt || 0).getTime();
      return ageMs > 24 * 60 * 60 * 1000;
    }).length;
    return { processing, totalRevenue, averageOrder, urgentActions };
  }, [normalizedOrders]);

  const filteredTotal = useMemo(
    () => filteredOrders.reduce((s, o) => s + Number(o.amount || 0), 0),
    [filteredOrders],
  );

  const pageTotal = useMemo(
    () => pageSlice.reduce((s, o) => s + Number(o.amount || 0), 0),
    [pageSlice],
  );

  const pageFrom = filteredOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(safePage * PAGE_SIZE, filteredOrders.length);

  const pageNumbers = useMemo(() => {
    const n = totalPages;
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
    const cur = safePage;
    const set = new Set([1, n, cur, cur - 1, cur + 1]);
    return Array.from(set)
      .filter((x) => x >= 1 && x <= n)
      .sort((a, b) => a - b);
  }, [totalPages, safePage]);

  return (
    <main className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Read-only view of all customer orders and line items. Status is set by
          vendors and workflows — not editable here.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-blue-100 p-4">
              <p className="text-xs text-gray-500">Total Processing</p>
              <p className="text-4xl font-semibold text-blue-600 mt-1">{stats.processing}</p>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100 p-4">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-4xl font-semibold text-emerald-600 mt-1">
                {money(stats.totalRevenue)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-violet-100 p-4">
              <p className="text-xs text-gray-500">Average Order</p>
              <p className="text-4xl font-semibold text-violet-600 mt-1">
                {money(stats.averageOrder)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 p-4">
              <p className="text-xs text-gray-500">Urgent Actions</p>
              <p className="text-4xl font-semibold text-orange-600 mt-1">
                {stats.urgentActions}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border ${
                    activeTab === tab
                      ? 'bg-white border-gray-300 shadow-sm text-gray-900'
                      : 'border-transparent text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`min-w-[1.5rem] h-6 px-1.5 inline-flex items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      activeTab === tab
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tabCounts[tab] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, customers, email, products..."
              className="w-full sm:max-w-md px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <span>
              {filteredOrders.length === 0
                ? 'No orders in this view'
                : `Showing ${pageFrom}–${pageTo} of ${filteredOrders.length} orders`}
            </span>
            <span className="text-gray-500">
              Filtered total: <span className="font-semibold text-gray-800">{money(filteredTotal)}</span>
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-gray-500">
                    <th className="px-4 py-3 text-left font-medium">Order ID</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">Products</th>
                    <th className="px-4 py-3 text-left font-medium">Order date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((order) => (
                    <tr key={order._id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-semibold text-gray-900 align-top">
                        {order.displayId}
                      </td>
                      <td className="px-4 py-3 text-gray-700 align-top">
                        <div>{order.customerName}</div>
                        {order.customerEmail ? (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {order.customerEmail}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-2 max-w-xs">
                          {order.productImage ? (
                            <img
                              src={order.productImage}
                              alt=""
                              className="w-9 h-9 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-gray-100 shrink-0" />
                          )}
                          <ul className="text-xs text-gray-800 space-y-0.5 min-w-0">
                            {order.productLines.map((line, idx) => (
                              <li key={idx} className="leading-snug">
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 align-top">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-GB')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border ${statusBadgeClass(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 align-top">
                        {money(order.amount)}
                      </td>
                    </tr>
                  ))}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F97316] text-white">
                    <td colSpan={5} className="px-4 py-3 font-semibold">
                      This page total ({pageSlice.length} orders)
                    </td>
                    <td className="px-4 py-3 font-semibold">{money(pageTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {totalPages > 1 ? (
            <nav
              className="flex flex-wrap items-center justify-center gap-2"
              aria-label="Pagination"
            >
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>
              {pageNumbers.map((n, idx) => (
                <span key={n} className="flex items-center">
                  {idx > 0 && pageNumbers[idx - 1] !== n - 1 ? (
                    <span className="px-1 text-gray-400">…</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-[2.25rem] h-9 px-3 rounded-full text-sm font-semibold transition-colors ${
                      n === safePage
                        ? 'bg-[#F97316] text-white shadow'
                        : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
};

export default Orders;
