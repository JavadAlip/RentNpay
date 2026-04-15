'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Package,
  Star,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { apiGetMyOrders } from '@/lib/api';
import {
  formatMoney,
  formatOrderDate,
  orderDisplayId,
  startOfDay,
  productImageUrl,
  normalizeStatus,
  resolveTenureUnit,
  computeLeaseEnd,
  computeNextPaymentLabel,
  daysUntilNextRent,
  orderLineTotal,
  primaryProduct,
  orderIsPurchase,
  purchaseLineTotal,
  firstMyRentalsEligibleLine,
} from '@/lib/orderRentalUtils';

const PAGE_SIZE = 5;

const ORANGE = 'bg-[#FF6F00] hover:bg-[#e56400]';
const ORANGE_TEXT = 'text-[#FF6F00]';
const ORANGE_BORDER = 'border-[#FF6F00]';

function rentalProductLines(order) {
  return (order.products || []).filter((line) => {
    const lineType = String(line?.productType || '').toLowerCase();
    if (lineType === 'sell') return false;
    const p = line?.product;
    if (!p || typeof p === 'string') return false;
    if (String(p?.type || '').toLowerCase() === 'sell') return false;
    return true;
  });
}

/** Delivered order should use the cancelled card only when every rental line has a return in progress. */
function everyRentalLineHasReturnRequest(order) {
  const lines = rentalProductLines(order);
  if (!lines.length) return false;
  return lines.every((line) => {
    const s = String(line?.returnRequest?.status || '');
    return s === 'requested' || s === 'review_submitted';
  });
}

function orderReturnLine(order) {
  return (order.products || []).find((line) => {
    const s = String(line?.returnRequest?.status || '');
    return s === 'requested' || s === 'review_submitted';
  });
}

function lineRefundableDeposit(line) {
  if (!line) return 0;
  const fromLine = Number(line.refundableDeposit);
  if (Number.isFinite(fromLine) && fromLine > 0) return fromLine;
  const p = line.product;
  if (p && typeof p === 'object') {
    const d = Number(p.refundableDeposit);
    if (Number.isFinite(d) && d > 0) return d;
  }
  return 0;
}

/** Card visual + tab membership for one order. */
function classifyOrder(order) {
  const st = normalizeStatus(order.status);
  const hubEligible =
    st === 'delivered' ? firstMyRentalsEligibleLine(order) : null;
  const product = hubEligible?.product ?? primaryProduct(order);
  const start = order.createdAt ? new Date(order.createdAt) : new Date();
  const unit = product
    ? resolveTenureUnit(order, product, order.rentalDuration)
    : order.tenureUnit === 'day'
      ? 'day'
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
  if (st === 'completed') {
    if (orderIsPurchase(order)) {
      return {
        kind: 'delivered_purchase',
        purchasePhase: 'completed',
        leaseEnd,
        daysLeft,
        unit,
        product,
      };
    }
    return {
      kind: 'completed_done',
      leaseEnd,
      daysLeft,
      unit,
      product,
    };
  }
  if (st === 'delivered') {
    if (orderIsPurchase(order)) {
      return {
        kind: 'delivered_purchase',
        purchasePhase: 'delivered',
        leaseEnd,
        daysLeft,
        unit,
        product,
      };
    }
    if (everyRentalLineHasReturnRequest(order)) {
      return {
        kind: 'cancelled',
        leaseEnd,
        daysLeft,
        unit,
        product,
      };
    }
    if (daysLeft > 0) {
      if (hubEligible) {
        return {
          kind: 'active_rental',
          leaseEnd,
          daysLeft,
          unit,
          product: hubEligible.product,
        };
      }
      return {
        kind: 'rental_missing_catalog',
        leaseEnd,
        daysLeft,
        unit,
        product,
      };
    }
    return {
      kind: 'tenure_ended',
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
    else if (kind === 'completed_done' || kind === 'delivered_purchase') {
      c.delivered += 1;
    } else if (kind === 'active_rental') c.active_rentals += 1;
  }
  return c;
}

function orderMatchesTab(order, tab) {
  const { kind } = classifyOrder(order);
  if (tab === 'all') return true;
  if (tab === 'cancelled') return kind === 'cancelled';
  if (tab === 'delivered') {
    return kind === 'completed_done' || kind === 'delivered_purchase';
  }
  if (tab === 'services') return false;
  if (tab === 'active_rentals') {
    return kind === 'active_rental';
  }
  return true;
}

function expectedDeliveryDate(order) {
  const d = order.createdAt ? new Date(order.createdAt) : new Date();
  d.setDate(d.getDate() + 7);
  return formatOrderDate(d);
}

export default function MyOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [returnPrompt, setReturnPrompt] = useState({
    open: false,
    orderId: '',
    orderRef: '',
    productId: '',
    title: '',
    image: '',
    cycleRent: 0,
    cycleUnit: 'month',
    startedOn: '',
    totalTenure: '',
    totalTenureLabel: 'Total Months',
    cycleEnds: '',
  });

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
        const hub = firstMyRentalsEligibleLine(o);
        const title = String(
          hub?.product?.productName ||
            hub?.product?.title ||
            primaryProduct(o)?.productName ||
            primaryProduct(o)?.title ||
            '',
        ).toLowerCase();
        return id.includes(q) || shortId.includes(q) || title.includes(q);
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
    {
      id: 'active_rentals',
      label: 'Active Rentals',
      count: counts.active_rentals,
    },
    { id: 'delivered', label: 'Completed', count: counts.delivered },
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
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
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
                <OrderCard
                  key={order._id}
                  order={order}
                  onOpenReturnPrompt={(payload) =>
                    setReturnPrompt({ open: true, ...payload })
                  }
                />
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </>
        )}

        {returnPrompt.open ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
            onClick={() =>
              setReturnPrompt((prev) => ({ ...prev, open: false }))
            }
          >
            <div
              className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3" />

              <div className="mt-4 rounded-xl border border-gray-200 bg-[#F7F8FB] p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                    {returnPrompt.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={returnPrompt.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {returnPrompt.title}
                    </p>
                    <div className="mt-0.5 inline-flex items-center gap-2">
                      <p className="text-xs text-emerald-700 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5">
                        Active Rental
                      </p>
                      <span className="text-xs text-gray-500">
                        Order #{returnPrompt.orderRef}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-700 space-y-1.5">
                  <p className="flex justify-between gap-3">
                    <span>Monthly Rent:</span>
                    <span className="font-medium">
                      ₹{formatMoney(returnPrompt.cycleRent)}/
                      {returnPrompt.cycleUnit === 'day' ? 'day' : 'month'}
                    </span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>Started:</span>
                    <span className="font-medium">
                      {returnPrompt.startedOn}
                    </span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>{returnPrompt.totalTenureLabel}:</span>
                    <span className="font-medium">
                      {returnPrompt.totalTenure}
                    </span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>Cycle Ends:</span>
                    <span className="font-semibold text-[#F97316]">
                      {returnPrompt.cycleEnds}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = `/my-rentals?openReturn=1&orderId=${encodeURIComponent(returnPrompt.orderId)}&productId=${encodeURIComponent(returnPrompt.productId)}`;
                  setReturnPrompt((prev) => ({ ...prev, open: false }));
                  router.push(next);
                }}
                className="mt-5 w-full rounded-xl border border-[#F97316] bg-white py-3 text-sm font-semibold text-[#F97316] hover:bg-orange-50"
              >
                End Tenancy / Return Item
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Rent cycle ends on{' '}
                <span className="font-semibold">{returnPrompt.cycleEnds}</span>.
                Schedule your return pickup now.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OrderCard({ order, onOpenReturnPrompt }) {
  const meta = classifyOrder(order);
  const product = meta.product;
  const img = productImageUrl(product?.image || '');
  const title = product?.productName || product?.title || 'Rental item';
  const total = orderLineTotal(order);
  const placed = formatOrderDate(order.createdAt);
  const oid = orderDisplayId(order);

  if (meta.kind === 'delivered_purchase') {
    const phase = meta.purchasePhase || 'delivered';
    const milestoneDate = formatOrderDate(order.updatedAt || order.createdAt);
    const headerDateLabel =
      phase === 'completed'
        ? `Completed on: ${milestoneDate}`
        : `Delivered on: ${milestoneDate}`;
    const badgeLabel = phase === 'completed' ? 'Completed' : 'Delivered';
    const purchaseTotal = purchaseLineTotal(order);
    const qty = order.products?.[0]?.quantity ?? 1;

    return (
      <li className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Order #{oid}</p>
            <p className="text-sm text-gray-500 mt-0.5">{headerDateLabel}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {badgeLabel}
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
              ₹{formatMoney(purchaseTotal)}
            </p>
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {phase === 'completed'
                ? 'Thank you — order complete'
                : 'Delivered successfully'}
            </p>
            {/* <p className="text-xs text-gray-500 mt-1.5">
              Qty: {qty}
              {phase === 'delivered' ? ' · Payment: Prepaid' : ''}
            </p> */}
          </div>
        </div>
        <div className="px-4 pb-4 pt-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            type="button"
            className="flex-1 min-h-[44px] rounded-xl border-2 border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4 text-gray-700" />
            Rate &amp; Review
          </button>
          <button
            type="button"
            className="text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline text-center sm:text-left sm:shrink-0"
          >
            Return or Exchange
          </button>
        </div>
      </li>
    );
  }

  if (meta.kind === 'cancelled') {
    const rrLine = orderReturnLine(order);
    const rr = rrLine?.returnRequest;
    const hasReturnTracking = Boolean(rr?.requestedAt);
    const refundShown = hasReturnTracking
      ? lineRefundableDeposit(rrLine)
      : total;
    const cancelledDetailDate = hasReturnTracking
      ? formatOrderDate(rr.requestedAt)
      : placed;

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
            <p
              className={`text-sm mt-2 flex items-center gap-1.5 text-emerald-600 font-medium`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Refund Processed: ₹{formatMoney(refundShown)} to Source
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {hasReturnTracking
                ? `Cancelled by you on ${cancelledDetailDate}`
                : `Cancelled on ${cancelledDetailDate}`}
            </p>
          </div>
        </div>
        <div className="px-4 pb-4 flex justify-end">
          {hasReturnTracking ? (
            <Link
              href={`/orders/return-status?orderId=${encodeURIComponent(order._id)}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View Refund Details
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 cursor-not-allowed">
              View Refund Details
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </li>
    );
  }

  if (meta.kind === 'completed_done') {
    if (!product) {
      return (
        <li className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="font-bold text-gray-900">Order #{oid}</p>
          <p className="text-sm text-gray-500 mt-1">Rental completed</p>
          <Link
            href="/my-rentals"
            className={`text-sm font-medium mt-2 inline-block ${ORANGE_TEXT}`}
          >
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
              Completed on:{' '}
              {formatOrderDate(order.updatedAt || order.createdAt)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
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
              ₹
              {formatMoney(
                Number(order.products?.[0]?.pricePerDay || 0) *
                  Number(order.products?.[0]?.quantity || 1),
              )}
              {resolveTenureUnit(order, product, order.rentalDuration) === 'day'
                ? '/day'
                : '/mo'}
            </p>
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Thank you — rental closed
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

  if (meta.kind === 'rental_missing_catalog') {
    return (
      <li className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-amber-100 bg-amber-50/50">
          <div>
            <p className="font-bold text-gray-900">Order #{oid}</p>
            <p className="text-sm text-gray-500 mt-0.5">Placed on: {placed}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            <Package className="w-3.5 h-3.5" />
            Delivered · details incomplete
          </span>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            This order is delivered, but product details are missing from the
            snapshot, so it does <span className="font-semibold">not</span> show
            under My Rentals and should not be treated as a normal active
            rental.
          </p>
          <p className="text-xs text-gray-500 mt-3">
            This is usually a data or loading issue. Contact support with your
            order ID if it does not clear after refresh.
          </p>
        </div>
      </li>
    );
  }

  if (meta.kind === 'active_rental') {
    const activeLine = firstMyRentalsEligibleLine(order);
    const tenureCount = Math.max(1, Number(order?.rentalDuration || 1));
    const cycleRent = Math.max(0, Math.round(Number(total || 0) / tenureCount));
    const cycleUnit = meta.unit === 'day' ? 'day' : 'month';
    const nextRentDays = product ? daysUntilNextRent(order, product) : null;
    const nextDueLabel = computeNextPaymentLabel(
      order.createdAt,
      meta.leaseEnd,
    );
    return (
      <li className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Order #{oid}</p>
            <p className="text-sm text-gray-500 mt-0.5">Placed on: {placed}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active rental
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
            <p className="text-sm text-gray-600 mt-2 flex items-start gap-2">
              <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
              <span>
                Tenure ends {formatOrderDate(meta.leaseEnd)} ·{' '}
                <span className="font-medium text-gray-800">
                  {meta.daysLeft} day{meta.daysLeft === 1 ? '' : 's'} left
                </span>
              </span>
            </p>
            {nextRentDays != null ? (
              <p className="text-sm text-gray-600 mt-1.5 flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                <span>
                  Next rent in {nextRentDays} day{nextRentDays === 1 ? '' : 's'}{' '}
                  ({nextDueLabel})
                </span>
              </p>
            ) : meta.unit === 'month' ? (
              <p className="text-sm text-gray-500 mt-1.5 flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                <span>Next cycle aligns with lease end ({nextDueLabel}).</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1.5">
                Day-based tenure — schedule is the dates above.
              </p>
            )}
          </div>
        </div>
        <div className="px-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/my-payments"
            className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 rounded-lg text-white text-sm font-semibold ${ORANGE}`}
          >
            Pay rent
          </Link>
          <button
            type="button"
            onClick={() => {
              const orderId = String(order?._id || '');
              const productId = String(activeLine?.product?._id || '');
              if (!orderId || !productId) return;
              onOpenReturnPrompt?.({
                orderId,
                orderRef: oid,
                productId,
                title,
                image: img,
                cycleRent,
                cycleUnit,
                startedOn: formatOrderDate(order.createdAt),
                totalTenure: String(order.rentalDuration || 0),
                totalTenureLabel:
                  cycleUnit === 'day' ? 'Total Days' : 'Total Months',
                cycleEnds: formatOrderDate(meta.leaseEnd),
              });
            }}
            className="inline-flex items-center justify-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 text-center sm:text-right"
          >
            Request Pickup / Close Rental
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
  }

  if (meta.kind === 'tenure_ended') {
    return (
      <li className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Order #{oid}</p>
            <p className="text-sm text-gray-500 mt-0.5">Placed on: {placed}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            <Package className="w-3.5 h-3.5" />
            Tenure ended
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
            <p className="text-sm text-gray-600 mt-2">
              Your rental period has ended. Please arrange return of the item;
              we&apos;ll mark this order complete once it&apos;s received.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Lease ended {formatOrderDate(meta.leaseEnd)}
            </p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Link
            href="/my-rentals"
            className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 rounded-lg text-white text-sm font-semibold ${ORANGE}`}
          >
            <MapPin className="w-4 h-4" />
            Open rental hub
          </Link>
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
            href={`/orders/${String(order._id)}/track`}
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
            We&apos;ll notify you when your product ships.
          </p>
        </div>
      </div>
      <div className="px-4 pb-4 flex justify-end">
        <span className="text-sm text-gray-600 inline-flex items-center justify-center sm:justify-end gap-1 cursor-pointer hover:underline">
          Need help?
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
    </li>
  );
}
