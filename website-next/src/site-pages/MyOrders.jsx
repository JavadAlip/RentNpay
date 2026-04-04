'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Truck,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Package,
  Star,
} from 'lucide-react';
import { apiGetMyOrders } from '@/lib/api';
import {
  formatMoney,
  startOfDay,
  computeNextPaymentLabel,
  productImageUrl,
  normalizeStatus,
  resolveTenureUnit,
  computeLeaseEnd,
  daysUntilNextRent,
  orderLineTotal,
  primaryProduct,
} from '@/lib/orderRentalUtils';

const PAGE_SIZE = 5;

const ORANGE = 'bg-[#FF6F00] hover:bg-[#e56400]';
const ORANGE_TEXT = 'text-[#FF6F00]';
const ORANGE_BORDER = 'border-[#FF6F00]';

function formatOrderDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function orderDisplayId(order) {
  const id = String(order._id || '');
  return id.slice(-6).toUpperCase() || id.slice(-8) || '—';
}

/** Card visual + tab membership for one order. */
function classifyOrder(order) {
  const st = normalizeStatus(order.status);
  const product = primaryProduct(order);
  const start = order.createdAt ? new Date(order.createdAt) : new Date();
  const unit = product
    ? resolveTenureUnit(order, product, order.rentalDuration)
    : 'month';
  const leaseEnd = computeLeaseEnd(start, order.rentalDuration, unit);
  const daysLeft = Math.ceil(
    (startOfDay(leaseEnd).getTime() - startOfDay(new Date()).getTime()) /
      86400000,
  );

  if (st === 'cancelled') {
    return {
      kind: 'cancelled',
      leaseEnd,
      daysLeft,
      unit,
      product,
    };
  }
  if (st === 'delivered' && daysLeft > 0) {
    return {
      kind: 'active_rental',
      leaseEnd,
      daysLeft,
      unit,
      product,
    };
  }
  if (st === 'delivered' && daysLeft <= 0) {
    return {
      kind: 'delivered_done',
      leaseEnd,
      daysLeft,
      unit,
      product,
    };
  }
  if (st === 'shipped') {
    return { kind: 'shipped', leaseEnd, daysLeft, unit, product };
  }
  return { kind: 'processing', leaseEnd, daysLeft, unit, product };
}

function tabCounts(orders) {
  const c = {
    all: orders.length,
    active_rentals: 0,
    delivered: 0,
    services: 0,
    cancelled: 0,
  };
  for (const o of orders) {
    const { kind } = classifyOrder(o);
    if (kind === 'cancelled') c.cancelled += 1;
    else if (kind === 'delivered_done') c.delivered += 1;
    else c.active_rentals += 1;
  }
  return c;
}

function orderMatchesTab(order, tab) {
  const { kind } = classifyOrder(order);
  if (tab === 'all') return true;
  if (tab === 'cancelled') return kind === 'cancelled';
  if (tab === 'delivered') return kind === 'delivered_done';
  if (tab === 'services') return false;
  if (tab === 'active_rentals')
    return (
      kind === 'active_rental' ||
      kind === 'shipped' ||
      kind === 'processing'
    );
  return true;
}

function expectedDeliveryDate(order) {
  const d = order.createdAt ? new Date(order.createdAt) : new Date();
  d.setDate(d.getDate() + 7);
  return formatOrderDate(d);
}

function rentPriceLabel(order, product) {
  const line = order.products?.[0];
  const qty = Number(line?.quantity || 1);
  const rate = Number(line?.pricePerDay || 0);
  const unit = product
    ? resolveTenureUnit(order, product, order.rentalDuration)
    : 'month';
  const u = rate * qty;
  if (unit === 'day') return `₹${formatMoney(u)}/day`;
  return `₹${formatMoney(u)}/month`;
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

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

  const counts = useMemo(() => tabCounts(orders), [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = orders.filter((o) => orderMatchesTab(o, tab));
    if (q) {
      list = list.filter((o) => {
        const id = String(o._id || '').toLowerCase();
        const shortId = orderDisplayId(o).toLowerCase();
        const title = String(
          primaryProduct(o)?.productName ||
            primaryProduct(o)?.title ||
            '',
        ).toLowerCase();
        return (
          id.includes(q) ||
          shortId.includes(q) ||
          title.includes(q)
        );
      });
    }
    return list;
  }, [orders, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [tab, query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const tabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active_rentals', label: 'Active Rentals', count: counts.active_rentals },
    { id: 'delivered', label: 'Delivered', count: counts.delivered },
    { id: 'services', label: 'Services', count: counts.services },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

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
    <div className="min-h-screen bg-[#F4F6FB] py-8 px-4 sm:px-6 pb-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          My Orders
        </h1>

        <div className="mt-6 bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Order ID or Item"
            className="w-full outline-none text-sm text-gray-800 placeholder:text-gray-400"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? `${ORANGE} text-white shadow-sm`
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t.label}
                <span
                  className={`min-w-[1.5rem] h-6 px-1.5 inline-flex items-center justify-center rounded-full text-xs font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#FF6F00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="mt-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
            {error}
          </div>
        ) : tab === 'services' ? (
          <div className="mt-10 text-center rounded-xl border border-dashed border-gray-300 bg-white/80 py-14 px-4">
            <p className="text-gray-700 font-medium">No service bookings yet</p>
            <p className="text-sm text-gray-500 mt-2">
              When you book services, they will appear here.
            </p>
            <Link
              href="/service"
              className={`inline-block mt-6 text-sm font-medium ${ORANGE_TEXT} hover:underline`}
            >
              Browse services
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 text-center py-14">
            <p className="text-gray-600 font-medium">No orders in this view</p>
            <p className="text-sm text-gray-500 mt-2">
              {query
                ? 'Try another search or filter.'
                : 'Browse rentals and place an order.'}
            </p>
            <Link
              href="/rent"
              className={`inline-flex mt-6 px-6 py-2.5 rounded-full text-white text-sm font-medium ${ORANGE}`}
            >
              Browse rentals
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-8 space-y-5">
              {pageSlice.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </ul>

            {totalPages > 1 ? (
              <nav
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
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
                          ? `${ORANGE} text-white shadow`
                          : 'text-gray-700 hover:bg-white border border-transparent hover:border-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const meta = classifyOrder(order);
  const product = meta.product;
  const img = productImageUrl(product?.image || '');
  const title =
    product?.productName || product?.title || 'Rental item';
  const total = orderLineTotal(order);
  const placed = formatOrderDate(order.createdAt);
  const oid = orderDisplayId(order);

  if (meta.kind === 'cancelled') {
    return (
      <li className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Order #{oid}</p>
            <p className="text-sm text-gray-500 mt-0.5">Placed on: {placed}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        </div>
        <div className="p-4 flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className={`text-sm mt-2 flex items-center gap-1.5 text-emerald-600`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Refund processed: ₹{formatMoney(total)} to source
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Cancelled on {placed}
            </p>
          </div>
        </div>
        <div className="px-4 pb-4 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            View refund details
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </li>
    );
  }

  if (meta.kind === 'active_rental') {
    if (!product) {
      return (
        <li className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 shadow-sm overflow-hidden p-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="font-bold text-gray-900">Order #{oid}</p>
              <p className="text-sm text-gray-600 mt-0.5">Rent started: {placed}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active Rental
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Product details are loading or unavailable. Open{' '}
            <Link href="/my-rentals" className={`font-medium ${ORANGE_TEXT}`}>
              Rental Command Center
            </Link>{' '}
            for more.
          </p>
        </li>
      );
    }
    const start = order.createdAt ? new Date(order.createdAt) : new Date();
    const nextDue = computeNextPaymentLabel(start, meta.leaseEnd);
    const dueIn = daysUntilNextRent(order, product);
    return (
      <li className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-emerald-100/80">
          <div>
            <p className="font-bold text-gray-900">Order #{oid}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              Rent started: {placed}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Rental
          </span>
        </div>
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-white shrink-0 mx-auto sm:mx-0">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-10 h-10" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-semibold text-gray-900 text-lg">{title}</p>
            <p className={`text-lg font-bold ${ORANGE_TEXT} mt-1`}>
              {rentPriceLabel(order, product)}
            </p>
            <p className="text-sm text-gray-600 mt-2 flex items-center justify-center sm:justify-start gap-2">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              Next rent due: {nextDue}
            </p>
            {dueIn != null && dueIn <= 14 ? (
              <p className="text-xs font-medium text-amber-700 mt-2 inline-flex items-center gap-1.5 justify-center sm:justify-start">
                <Clock className="w-3.5 h-3.5" />
                Payment due in {dueIn} day{dueIn === 1 ? '' : 's'}
              </p>
            ) : null}
            {meta.unit === 'day' ? (
              <p className="text-xs text-gray-500 mt-2">
                Lease ends {formatOrderDate(meta.leaseEnd)} ·{' '}
                {meta.daysLeft} day{meta.daysLeft === 1 ? '' : 's'} left
              </p>
            ) : null}
          </div>
        </div>
        <div className="px-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/payment-lists"
            className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:min-w-[200px] px-4 py-3 rounded-lg border-2 ${ORANGE_BORDER} bg-white ${ORANGE_TEXT} text-sm font-semibold hover:bg-orange-50`}
          >
            <Wallet className="w-4 h-4" />
            Pay rent
          </Link>
          <Link
            href="/my-rentals"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 text-center sm:text-right"
          >
            Request pickup / Close rental
          </Link>
        </div>
      </li>
    );
  }

  if (meta.kind === 'delivered_done') {
    if (!product) {
      return (
        <li className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="font-bold text-gray-900">Order #{oid}</p>
          <p className="text-sm text-gray-500 mt-1">Rental completed</p>
          <Link href="/my-rentals" className={`text-sm font-medium mt-2 inline-block ${ORANGE_TEXT}`}>
            View details
          </Link>
        </li>
      );
    }
    return (
      <li className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Order #{oid}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Delivered on: {formatOrderDate(order.updatedAt || order.createdAt)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        </div>
        <div className="p-4 flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className={`text-base font-bold ${ORANGE_TEXT} mt-1`}>
              ₹{formatMoney(
                Number(order.products?.[0]?.pricePerDay || 0) *
                  Number(order.products?.[0]?.quantity || 1),
              )}
              {resolveTenureUnit(order, product, order.rentalDuration) === 'day'
                ? '/day'
                : '/mo'}
            </p>
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Rental period completed
            </p>
          </div>
        </div>
        <div className="px-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            className="w-full sm:w-auto sm:min-w-[200px] px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            Rate &amp; review
          </button>
          <span className="text-sm text-gray-600 text-center sm:text-right cursor-pointer hover:underline">
            Return or exchange
          </span>
        </div>
      </li>
    );
  }

  if (meta.kind === 'shipped') {
    return (
      <li className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Order #{oid}</p>
            <p className="text-sm text-gray-500 mt-0.5">Placed on: {placed}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        </div>
        <div className="p-4 flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className={`text-base font-bold ${ORANGE_TEXT} mt-1`}>
              ₹{formatMoney(total)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Qty: {order.products?.[0]?.quantity ?? 1} · Expected delivery:{' '}
              {expectedDeliveryDate(order)}
            </p>
          </div>
        </div>
        <div className="px-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/my-rentals"
            className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 rounded-lg text-white text-sm font-semibold ${ORANGE}`}
          >
            <MapPin className="w-4 h-4" />
            Track order
          </Link>
          <span className="text-sm text-gray-600 inline-flex items-center justify-center sm:justify-end gap-1 cursor-pointer hover:underline">
            Need help?
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </li>
    );
  }

  const procLabel =
    normalizeStatus(order.status) === 'confirmed' ? 'Confirmed' : 'Processing';
  return (
    <li className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900">Order #{oid}</p>
          <p className="text-sm text-gray-500 mt-0.5">Placed on: {placed}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
          <Package className="w-3.5 h-3.5" />
          {procLabel}
        </span>
      </div>
      <div className="p-4 flex gap-4">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{title}</p>
          <p className={`text-base font-bold ${ORANGE_TEXT} mt-1`}>
            ₹{formatMoney(total)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            We&apos;ll notify you when your rental ships.
          </p>
        </div>
      </div>
      <div className="px-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/my-rentals"
          className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 rounded-lg text-white text-sm font-semibold ${ORANGE}`}
        >
          <MapPin className="w-4 h-4" />
          Track order
        </Link>
        <span className="text-sm text-gray-600 inline-flex items-center justify-center sm:justify-end gap-1 cursor-pointer hover:underline">
          Need help?
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
    </li>
  );
}
