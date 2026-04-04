'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sofa,
  BarChart3,
  Shield,
  Calendar,
  Clock,
  Package,
  Wrench,
} from 'lucide-react';
import { apiGetMyOrders } from '@/lib/api';

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-IN');
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function ordinalDay(d) {
  const n = d.getDate();
  const j = n % 10;
  const k = n % 100;
  if (k > 10 && k < 14) return `${n}th`;
  if (j === 1) return `${n}st`;
  if (j === 2) return `${n}nd`;
  if (j === 3) return `${n}rd`;
  return `${n}th`;
}

function computeNextPaymentLabel(startDate, leaseEnd) {
  const start = new Date(startDate);
  const end = new Date(leaseEnd);
  const now = new Date();
  if (now >= end) {
    return `${ordinalDay(end)} ${end.toLocaleString('en-IN', { month: 'long' })}`;
  }
  const billDay = Math.min(start.getDate(), 28);
  let c = new Date(now.getFullYear(), now.getMonth(), billDay);
  if (c <= now) c = new Date(now.getFullYear(), now.getMonth() + 1, billDay);
  if (c > end) {
    return `${ordinalDay(end)} ${end.toLocaleString('en-IN', { month: 'long' })}`;
  }
  return `${ordinalDay(c)} ${c.toLocaleString('en-IN', { month: 'long' })}`;
}

function productImageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  ).replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function normalizeStatus(status) {
  return String(status || '').toLowerCase();
}

/**
 * Legacy inference when `order.tenureUnit` is missing: day tenure only if a day tier
 * matches `rentalDuration` and there is no separate month tier with the same duration
 * (avoids 3 days vs 3 months ambiguity when the order stores `3`).
 */
function tenureIsDays(product, rentalDuration) {
  const rd = Number(rentalDuration);
  if (!Number.isFinite(rd) || rd < 1) return false;
  const cfgs = Array.isArray(product?.rentalConfigurations)
    ? product.rentalConfigurations
    : [];
  if (!cfgs.length) return false;

  const matchDay = cfgs.some(
    (c) =>
      String(c?.periodUnit || '').toLowerCase() === 'day' &&
      Number(c?.days || 0) === rd,
  );
  if (!matchDay) return false;

  const hasMonthTierSameDuration = cfgs.some((c) => {
    const months = Number(c?.months || 0);
    if (months !== rd || months <= 0) return false;
    return String(c?.periodUnit || '').toLowerCase() !== 'day';
  });
  if (hasMonthTierSameDuration) return false;

  return true;
}

function resolveTenureUnit(order, product, rentalDuration) {
  if (order.tenureUnit === 'day') return 'day';
  if (order.tenureUnit === 'month') return 'month';
  return tenureIsDays(product, rentalDuration) ? 'day' : 'month';
}

function computeLeaseEnd(start, durationRaw, unit) {
  const n = Math.max(1, Number(durationRaw || 1));
  const d = new Date(start.getTime());
  if (unit === 'day') d.setDate(d.getDate() + n);
  else d.setMonth(d.getMonth() + n);
  return d;
}

function flattenRentals(orders) {
  const rows = [];
  for (const order of orders) {
    if (normalizeStatus(order.status) === 'cancelled') continue;
    const start = order.createdAt ? new Date(order.createdAt) : new Date();
    const duration = order.rentalDuration;
    for (const line of order.products || []) {
      const p = line.product;
      if (!p || typeof p === 'string') continue;
      const unit = resolveTenureUnit(order, p, duration);
      const end = computeLeaseEnd(start, duration, unit);
      rows.push({ order, line, product: p, start, end, tenureUnit: unit });
    }
  }
  return rows;
}

function parseDeposit(product) {
  const v = product?.refundableDeposit;
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Prefer deposit snapshot on the order line when it was persisted (> 0).
 * Lines often have `refundableDeposit: 0` from schema defaults or pre-snapshot
 * orders — in that case use the populated product (same source as product detail).
 */
function lineDeposit(line, product) {
  const fromLine = Number(line?.refundableDeposit);
  if (Number.isFinite(fromLine) && fromLine > 0) return fromLine;
  return parseDeposit(product);
}

function buildActivity(order, lineTotalRent) {
  const t = order.createdAt ? new Date(order.createdAt) : new Date();
  const items = [
    {
      text: `Payment successful — ₹${formatMoney(lineTotalRent)}`,
      date: t,
    },
  ];
  const st = normalizeStatus(order.status);
  if (st === 'delivered') {
    items.push({
      text: 'Delivered to your address',
      date: t,
    });
  } else if (st === 'shipped') {
    items.push({
      text: 'Shipment in progress',
      date: t,
    });
  } else if (st === 'confirmed') {
    items.push({
      text: 'Order confirmed by vendor',
      date: t,
    });
  }
  return items;
}

function formatShortDate(d) {
  return d.toLocaleString('en-IN', { month: 'short', day: 'numeric' });
}

export default function RentalCommandCenter() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiGetMyOrders()
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        setOrders([]);
        setError(err.response?.data?.message || 'Failed to load rentals.');
      })
      .finally(() => setLoading(false));
  }, []);

  const rentals = useMemo(() => flattenRentals(orders), [orders]);
  const today = startOfDay(new Date());

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sofa className="w-7 h-7 text-blue-600 shrink-0" aria-hidden />
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Rental Command Center
              </h1>
            </div>
            <p className="text-sm text-gray-500 mb-8">
              Active Rentals ({rentals.length}{' '}
              {rentals.length === 1 ? 'Item' : 'Items'})
            </p>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
                {error}
              </div>
            ) : rentals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                <p className="text-gray-700 font-medium">
                  No active rentals yet
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  When you rent products, they will show up here with tenure and
                  payment details.
                </p>
                <Link
                  href="/rent"
                  className="inline-flex mt-6 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Browse rentals
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {rentals.map(
                  ({ order, line, product, start, end, tenureUnit }, idx) => {
                    const title =
                      product.productName || product.title || 'Rented product';
                    const img = productImageUrl(product.image);
                    const vendorName =
                      product.vendorId?.fullName ||
                      product.vendorId?.emailAddress ||
                      'Vendor';
                    const city =
                      product.logisticsVerification?.city?.trim() ||
                      'Your city';

                    const qty = Number(line.quantity || 1);
                    const rate = Number(line.pricePerDay || 0);
                    const dur = Math.max(1, Number(order.rentalDuration || 1));
                    const isDay = tenureUnit === 'day';

                    const unitRent = rate * qty;
                    const lineTotalRent = unitRent * dur;

                    const rentPrimaryLabel = isDay
                      ? `₹${formatMoney(unitRent)}/day`
                      : `₹${formatMoney(unitRent)}/mo`;
                    const rentCardTitle = isDay ? 'Daily rate' : 'Monthly rent';
                    const rentSubline = isDay
                      ? `${dur} day${dur === 1 ? '' : 's'} tenure · ₹${formatMoney(lineTotalRent)} total`
                      : `${dur} month${dur === 1 ? '' : 's'} tenure · ₹${formatMoney(lineTotalRent)} total`;

                    const deposit = lineDeposit(line, product);
                    const nextPay = computeNextPaymentLabel(start, end);
                    const discounted = isDay
                      ? Math.max(1, Math.round(unitRent * 0.92))
                      : Math.max(
                          1,
                          unitRent - Math.max(50, Math.round(unitRent * 0.08)),
                        );

                    const totalMs = end.getTime() - start.getTime();
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

                    const daysLeft = Math.ceil(
                      (startOfDay(end).getTime() - today.getTime()) / 86400000,
                    );
                    const isEnded = daysLeft <= 0;
                    const isUrgent = !isEnded && daysLeft <= 5;

                    const activity = buildActivity(order, lineTotalRent);

                    const progressBox = isEnded
                      ? {
                          wrap: 'bg-red-50 border border-red-100',
                          headline: 'text-red-800',
                          bar: 'bg-red-500',
                        }
                      : isUrgent
                        ? {
                            wrap: 'bg-amber-50 border border-amber-100',
                            headline: 'text-amber-800',
                            bar: 'bg-amber-500',
                          }
                        : {
                            wrap: 'bg-blue-50 border border-blue-100',
                            headline: 'text-blue-800',
                            bar: 'bg-blue-500',
                          };

                    const cardBorder = isEnded
                      ? 'border-2 border-red-200 ring-1 ring-red-100'
                      : isUrgent
                        ? 'border-2 border-amber-200 ring-1 ring-amber-100'
                        : 'border-2 border-blue-100 ring-1 ring-blue-50';

                    return (
                      <article
                        key={`${order._id}-${String(line.product?._id || line.product || idx)}-${idx}`}
                        className={`bg-white rounded-xl shadow-sm overflow-hidden ${cardBorder}`}
                      >
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h2 className="text-lg font-bold text-gray-900">
                                    {title}
                                  </h2>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    Rented from: {vendorName}
                                    {city ? ` (${city})` : ''}
                                  </p>
                                </div>
                                {isEnded ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                    Ended
                                  </span>
                                ) : isUrgent ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                    Expiring in {daysLeft}{' '}
                                    {daysLeft === 1 ? 'Day' : 'Days'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                  </span>
                                )}
                              </div>

                              <div
                                className={`mt-6 rounded-xl px-4 py-5 ${progressBox.wrap}`}
                              >
                                <p className="text-center text-xs text-gray-500 uppercase tracking-wide">
                                  Tenure progress
                                </p>
                                <p
                                  className={`text-center text-2xl font-bold mt-1 ${progressBox.headline}`}
                                >
                                  {isEnded
                                    ? 'Tenure ended'
                                    : `${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'} remaining`}
                                </p>
                                <div className="mt-6 relative pt-2">
                                  <div className="h-2.5 rounded-full bg-gray-200/90 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${progressBox.bar}`}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <div
                                    className="absolute top-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm -translate-x-1/2"
                                    style={{ left: `${progressPct}%` }}
                                    title="Today"
                                  />
                                  <div className="flex justify-between mt-2 text-[11px] text-gray-500">
                                    <span>{formatShortDate(start)}</span>
                                    <span className="text-gray-600 font-medium">
                                      Today
                                    </span>
                                    <span>{formatShortDate(end)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                    {rentCardTitle}
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">
                                    {rentPrimaryLabel}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {rentSubline}
                                  </p>
                                  {!isDay ? (
                                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                                      Auto-pay active
                                    </p>
                                  ) : null}
                                </div>
                                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                    <Shield className="w-4 h-4 text-emerald-600" />
                                    Security deposit
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">
                                    ₹{formatMoney(deposit)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Refundable
                                  </p>
                                </div>
                                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                    <Calendar className="w-4 h-4 text-violet-600" />
                                    Next payment
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">
                                    {nextPay}
                                  </p>
                                </div>
                              </div>

                              {!isEnded ? (
                                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-4">
                                  <p className="text-sm text-gray-700">
                                    {isDay
                                      ? 'Want to keep it longer? Extend at '
                                      : 'Want to keep it longer? Extend for another month at '}
                                    <span className="font-semibold text-blue-700">
                                      ₹{formatMoney(discounted)}
                                      {isDay ? '/day' : '/mo'}
                                    </span>{' '}
                                    <span className="text-blue-600">
                                      (Discounted!)
                                    </span>
                                  </p>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Extend tenure
                                  </button>
                                </div>
                              ) : null}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-50"
                                >
                                  <Package className="w-4 h-4" />
                                  Request return / Pickup
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-50"
                                >
                                  <Wrench className="w-4 h-4" />
                                  Report issue / Repair
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">
                              Recent activity
                            </h3>
                            <ul className="space-y-3">
                              {activity.map((row, i) => (
                                <li
                                  key={i}
                                  className="flex items-start justify-between gap-3 text-sm"
                                >
                                  <span className="flex items-start gap-2 min-w-0 text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                    <span>{row.text}</span>
                                  </span>
                                  <span className="text-gray-400 text-xs shrink-0 tabular-nums">
                                    {row.date.toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
