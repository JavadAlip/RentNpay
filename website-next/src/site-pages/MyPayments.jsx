'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  FileText,
  Home,
  ShoppingBag,
  Wrench,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiGetMyOrders } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
  formatMoney,
  startOfDay,
  productImageUrl,
  normalizeStatus,
  flattenActiveLeaseRows,
  lineUnitRent,
  orderLineTotal,
} from '@/lib/orderRentalUtils';

const HISTORY_PAGE_SIZE = 5;
const ORANGE_BTN =
  'w-full py-3.5 rounded-2xl bg-[#FF6F00] hover:bg-[#e56400] text-white font-semibold text-base shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none';

function formatLongDate(d) {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(d);
  return x.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function transactionId(order) {
  const y = order.createdAt
    ? new Date(order.createdAt).getFullYear()
    : new Date().getFullYear();
  const tail = String(order._id || '')
    .replace(/[^a-fA-F0-9]/g, '')
    .slice(-6)
    .toUpperCase();
  return `TXN-${y}-${tail || '000000'}`;
}

export default function MyPayments() {
  const { pushToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiGetMyOrders()
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        setOrders([]);
        setError(err.response?.data?.message || 'Failed to load payments.');
      })
      .finally(() => setLoading(false));
  }, []);

  const activeRows = useMemo(() => flattenActiveLeaseRows(orders), [orders]);

  useEffect(() => {
    setSelected((prev) => prev.filter((k) => activeRows.some((r) => r.key === k)));
  }, [activeRows]);

  const toggleSelect = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === activeRows.length) setSelected([]);
    else setSelected(activeRows.map((r) => r.key));
  };

  const payTotal = useMemo(() => {
    const keys =
      selected.length > 0 ? selected : activeRows.map((r) => r.key);
    let sum = 0;
    for (const r of activeRows) {
      if (!keys.includes(r.key)) continue;
      sum += lineUnitRent(r.line);
    }
    return sum;
  }, [activeRows, selected]);

  const historyRows = useMemo(() => {
    const list = [...orders].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
    return list.map((order) => ({
      id: transactionId(order),
      date: formatLongDate(order.createdAt),
      amount: `₹${formatMoney(orderLineTotal(order))}`,
      type: 'Rent',
      status: normalizeStatus(order.status) === 'cancelled' ? 'Failed' : 'Success',
    }));
  }, [orders]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(historyRows.length / HISTORY_PAGE_SIZE),
  );
  const historySafePage = Math.min(historyPage, historyTotalPages);
  const historySlice = historyRows.slice(
    (historySafePage - 1) * HISTORY_PAGE_SIZE,
    historySafePage * HISTORY_PAGE_SIZE,
  );

  useEffect(() => {
    if (historyPage > historyTotalPages) setHistoryPage(historyTotalPages);
  }, [historyPage, historyTotalPages]);

  const historyPageNums = useMemo(() => {
    const n = historyTotalPages;
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
    const cur = historySafePage;
    const set = new Set([1, n, cur, cur - 1, cur + 1]);
    return Array.from(set)
      .filter((x) => x >= 1 && x <= n)
      .sort((a, b) => a - b);
  }, [historyTotalPages, historySafePage]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Rent':
        return <Home className="w-3.5 h-3.5 text-blue-600" />;
      case 'Buy':
        return <ShoppingBag className="w-3.5 h-3.5 text-green-600" />;
      case 'Service':
        return <Wrench className="w-3.5 h-3.5 text-violet-600" />;
      default:
        return null;
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Rent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Buy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Service':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] py-8 px-3 sm:px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1A3A] tracking-tight">
          My Payments
        </h1>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#FF6F00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="mt-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
            {error}
          </div>
        ) : (
          <>
            <section className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Active Rentals
                </h2>
              </div>

              {activeRows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                  <p className="text-gray-600 font-medium">
                    No scheduled payments right now
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Orders that are confirmed or in transit may appear here.
                    Once an order is marked Delivered, it moves to your order
                    history instead.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {activeRows.map((row) => {
                      const { key, product, start, end, line, daysLeft } = row;
                      const img = productImageUrl(product?.image || '');
                      const title =
                        product?.productName || product?.title || 'Rental item';
                      const category = product?.category || 'Rental';
                      const unit = row.tenureUnit;
                      const unitRent = lineUnitRent(line);
                      const priceStr = `₹${formatMoney(unitRent)}`;
                      const suffix = unit === 'day' ? '/day' : '/month';

                      const totalMs = end.getTime() - start.getTime();
                      const today = startOfDay(new Date());
                      const elapsedMs = Math.min(
                        Math.max(
                          today.getTime() - startOfDay(start).getTime(),
                          0,
                        ),
                        totalMs,
                      );
                      const progressPct =
                        totalMs <= 0
                          ? 100
                          : Math.min(100, (elapsedMs / totalMs) * 100);

                      const barClass =
                        daysLeft <= 5 ? 'bg-amber-500' : 'bg-blue-600';

                      return (
                        <div
                          key={key}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={selected.includes(key)}
                                onChange={() => toggleSelect(key)}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#FF6F00] focus:ring-[#FF6F00] shrink-0"
                                aria-label={`Select ${title}`}
                              />
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                {img ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={img}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    No img
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {title}
                                </p>
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {category}
                                </p>
                              </div>
                            </div>
                            <p className="text-base font-bold text-gray-900 sm:text-right shrink-0 pl-7 sm:pl-0">
                              {priceStr}
                              <span className="text-sm font-semibold text-gray-500">
                                {suffix}
                              </span>
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-2">
                              <span>
                                Start date
                                <br />
                                <span className="text-sm font-semibold text-gray-900 normal-case tracking-normal">
                                  {formatLongDate(start)}
                                </span>
                              </span>
                              <span className="text-right">
                                End date
                                <br />
                                <span className="text-sm font-semibold text-gray-900 normal-case tracking-normal">
                                  {formatLongDate(end)}
                                </span>
                              </span>
                            </div>
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${barClass}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-3 px-1">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      {selected.length === activeRows.length
                        ? 'Deselect all'
                        : 'Select all'}
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`${ORANGE_BTN} mt-4`}
                    disabled={activeRows.length === 0}
                    onClick={() => {
                      pushToast(
                        `Pay ₹${formatMoney(payTotal)} for ${selected.length || activeRows.length} item(s). Connect your payment gateway here.`,
                        'info',
                      );
                    }}
                  >
                    Pay All
                    {payTotal > 0 ? ` · ₹${formatMoney(payTotal)}` : ''}
                  </button>
                </>
              )}
            </section>

            <section className="mt-12">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Order History
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {historyRows.length === 0 ? (
                  <p className="p-8 text-center text-gray-500 text-sm">
                    No transactions yet.
                  </p>
                ) : (
                  <>
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                              Transaction ID
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                              Type
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {historySlice.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b border-gray-100 last:border-0"
                            >
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                {row.id}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {row.date}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {row.amount}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getTypeBadgeClass(row.type)}`}
                                >
                                  {getTypeIcon(row.type)}
                                  {row.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-sm font-medium ${
                                    row.status === 'Success'
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {row.status === 'Success' ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="sm:hidden divide-y divide-gray-100">
                      {historySlice.map((row) => (
                        <div key={row.id} className="p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">
                              Transaction ID
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {row.id}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Date</span>
                            <span className="text-sm text-gray-900">
                              {row.date}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Amount</span>
                            <span className="text-sm font-medium text-gray-900">
                              {row.amount}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Type</span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${getTypeBadgeClass(row.type)}`}
                            >
                              {getTypeIcon(row.type)}
                              {row.type}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Status</span>
                            <span
                              className={`inline-flex items-center gap-1 text-sm font-medium ${
                                row.status === 'Success'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {row.status === 'Success' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              {row.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {historyTotalPages > 1 ? (
                      <nav
                        className="flex flex-wrap items-center justify-center gap-2 py-4 border-t border-gray-100"
                        aria-label="Order history pagination"
                      >
                        <button
                          type="button"
                          disabled={historySafePage <= 1}
                          onClick={() =>
                            setHistoryPage((p) => Math.max(1, p - 1))
                          }
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40"
                        >
                          Previous
                        </button>
                        {historyPageNums.map((n, idx) => (
                          <span key={n} className="inline-flex items-center">
                            {idx > 0 && historyPageNums[idx - 1] !== n - 1 ? (
                              <span className="px-1 text-gray-400">…</span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setHistoryPage(n)}
                              className={`min-w-[2.25rem] h-9 px-2 rounded-full text-sm font-semibold ${
                                n === historySafePage
                                  ? 'bg-[#FF6F00] text-white shadow'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {n}
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          disabled={historySafePage >= historyTotalPages}
                          onClick={() =>
                            setHistoryPage((p) =>
                              Math.min(historyTotalPages, p + 1),
                            )
                          }
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </nav>
                    ) : null}
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
