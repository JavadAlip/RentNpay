'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Minus,
  PackageCheck,
  TrendingUp,
  Truck,
  XCircle,
} from 'lucide-react';
import { apiGetAllOrders } from '@/service/api';
import totalOrdersIcon from '@/assets/icons/total-orders.png';
import totalRevenueIcon from '@/assets/icons/total-revenue.png';
import fulfillmentTimeIcon from '@/assets/icons/fullfilment-time.png';
import activeRentalsIcon from '@/assets/icons/active-rentals.png';
import deliveredStatusIcon from '@/assets/icons/delivered1.png';
import processingStatusIcon from '@/assets/icons/processing.png';
import transitStatusIcon from '@/assets/icons/transist.png';
import cancelledStatusIcon from '@/assets/icons/cancel.png';
import processProductIcon from '@/assets/icons/process-prdct.png';

function money(n) {
  return `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
}

function orderGmv(order) {
  return (order.products || []).reduce(
    (sum, item) =>
      sum +
      Number(item.pricePerDay || 0) *
        Number(item.quantity || 0) *
        Number(order.rentalDuration || 0),
    0,
  );
}

function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'delivered' || s === 'completed') return 'delivered';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'shipped' || s === 'in_transit' || s === 'in transit')
    return 'in_transit';
  return 'processing';
}

function relativeTime(dateValue) {
  const ts = new Date(dateValue || 0).getTime();
  if (!ts) return 'Just now';
  const diffMs = Date.now() - ts;
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function pctDelta(cur, prev) {
  if (prev <= 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

function statusLabel(statusKey) {
  if (statusKey === 'delivered') return 'Delivered';
  if (statusKey === 'processing') return 'Processing';
  if (statusKey === 'in_transit') return 'In Transit';
  return 'Cancelled';
}

function statusTone(statusKey) {
  if (statusKey === 'delivered') return 'bg-[#007BFF]';
  if (statusKey === 'processing') return 'bg-[#10B981]';
  if (statusKey === 'in_transit') return 'bg-[#F97316]';
  return 'bg-[#FBBF24]';
}

function statusTextTone(statusKey) {
  if (statusKey === 'delivered') return 'text-blue-500';
  if (statusKey === 'processing') return 'text-emerald-500';
  if (statusKey === 'in_transit') return 'text-orange-500';
  return 'text-gray-500';
}

function statusIcon(statusKey) {
  if (statusKey === 'delivered') return CheckCircle2;
  if (statusKey === 'processing') return PackageCheck;
  if (statusKey === 'in_transit') return Truck;
  return XCircle;
}

function statusImage(statusKey) {
  if (statusKey === 'delivered') return deliveredStatusIcon;
  if (statusKey === 'processing') return processingStatusIcon;
  if (statusKey === 'in_transit') return transitStatusIcon;
  return cancelledStatusIcon;
}

function StatusDonut({ rows }) {
  const size = 260;
  const pad = 34;
  const stroke = 44;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  let startPct = 0;

  const arcs = rows.map((row) => {
    const len = (row.pct / 100) * circ;
    const midPct = startPct + row.pct / 2;
    const angle = (midPct / 100) * Math.PI * 2 - Math.PI / 2;
    // Place percentage labels outside the ring like Figma.
    const labelRadius = r + stroke / 2 + 20;
    const labelX = c + Math.cos(angle) * labelRadius;
    const labelY = c + Math.sin(angle) * labelRadius;
    const arc = (
      <g key={row.key}>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={row.color}
          strokeWidth={stroke}
          strokeDasharray={`${len} ${circ - len}`}
          strokeDashoffset={-offset}
          transform={`rotate(-90 ${c} ${c})`}
        />
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] font-semibold"
          fill={row.color}
        >
          {row.pct}%
        </text>
      </g>
    );
    offset += len;
    startPct += row.pct;
    return arc;
  });

  return (
    <svg
      width="100%"
      viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
      className="max-w-[300px] mx-auto"
      aria-hidden
    >
      {arcs}
      <circle cx={c} cy={c} r={r - stroke / 2 + 4} fill="#ffffff" />
    </svg>
  );
}

const STATUS_COLORS = {
  delivered: '#007BFF',
  processing: '#10b981',
  in_transit: '#f97316',
  cancelled: '#FBBF24',
};

const OrderAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    apiGetAllOrders(token)
      .then((res) => {
        if (!mounted) return;
        setOrders(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err.response?.data?.message || 'Failed to load order analytics.',
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const analytics = useMemo(() => {
    const now = Date.now();
    const d30 = 30 * 24 * 60 * 60 * 1000;
    const inCurrent = (o) => now - new Date(o.createdAt || 0).getTime() <= d30;
    const inPrevious = (o) => {
      const age = now - new Date(o.createdAt || 0).getTime();
      return age > d30 && age <= d30 * 2;
    };

    const all = orders || [];
    const current = all.filter(inCurrent);
    const previous = all.filter(inPrevious);

    const totalOrders = current.length;
    const prevOrders = previous.length;

    const totalRevenue = current.reduce((s, o) => s + orderGmv(o), 0);
    const prevRevenue = previous.reduce((s, o) => s + orderGmv(o), 0);

    const deliveredCurrent = current.filter(
      (o) => normalizeStatus(o.status) === 'delivered',
    );
    const deliveredPrevious = previous.filter(
      (o) => normalizeStatus(o.status) === 'delivered',
    );
    const avgFulfillCurrent =
      deliveredCurrent.reduce((s, o) => {
        const created = new Date(o.createdAt || 0).getTime();
        const closed = new Date(o.updatedAt || o.createdAt || 0).getTime();
        if (!created || !closed || closed < created) return s;
        return s + (closed - created) / (24 * 60 * 60 * 1000);
      }, 0) / Math.max(deliveredCurrent.length, 1);
    const avgFulfillPrev =
      deliveredPrevious.reduce((s, o) => {
        const created = new Date(o.createdAt || 0).getTime();
        const closed = new Date(o.updatedAt || o.createdAt || 0).getTime();
        if (!created || !closed || closed < created) return s;
        return s + (closed - created) / (24 * 60 * 60 * 1000);
      }, 0) / Math.max(deliveredPrevious.length, 1);

    const activeRentals = all.reduce((sum, o) => {
      if (normalizeStatus(o.status) === 'cancelled') return sum;
      return (
        sum +
        (o.products || []).filter(
          (item) => String(item.productType || '').toLowerCase() !== 'sell',
        ).length
      );
    }, 0);

    const counts = {
      delivered: 0,
      processing: 0,
      in_transit: 0,
      cancelled: 0,
    };
    all.forEach((o) => {
      counts[normalizeStatus(o.status)] += 1;
    });
    const totalForStatus =
      Object.values(counts).reduce((s, n) => s + n, 0) || 1;
    const statusRows = Object.entries(counts).map(([key, count]) => ({
      key,
      label: statusLabel(key),
      count,
      pct: Math.round((count / totalForStatus) * 100),
      color: STATUS_COLORS[key],
      icon: statusIcon(key),
    }));
    statusRows.sort((a, b) => b.count - a.count);
    const pctFix = statusRows.reduce((s, x) => s + x.pct, 0);
    if (statusRows.length && pctFix !== 100) {
      statusRows[statusRows.length - 1].pct += 100 - pctFix;
    }

    const recent = [...all]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0),
      )
      .slice(0, 5)
      .map((o) => {
        const statusKey = normalizeStatus(o.status);
        const name = o.user?.fullName || o.user?.name || 'Customer';
        const code = String(o._id || '')
          .slice(-4)
          .toUpperCase();
        return {
          id: o._id,
          statusKey,
          title: `ORD-${code}`,
          subtitle: `Moved to ${statusLabel(statusKey)}`,
          user: name,
          when: relativeTime(o.updatedAt || o.createdAt),
        };
      });

    const deliveredRate = Math.round((counts.delivered / totalForStatus) * 100);

    return {
      totalOrders,
      totalOrdersDelta: pctDelta(totalOrders, prevOrders),
      totalRevenue,
      totalRevenueDelta: pctDelta(totalRevenue, prevRevenue),
      avgFulfillCurrent,
      avgFulfillPrev,
      activeRentals,
      statusRows,
      recent,
      deliveredRate,
      counts,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
        {error}
      </div>
    );
  }

  const fulfillDelta = analytics.avgFulfillPrev - analytics.avgFulfillCurrent;

  return (
    <div className="min-h-full bg-[#f2f4f8] -m-3 sm:-m-4 md:-m-6 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Order Analytics
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            Track and manage your order operations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              title: 'Total Orders',
              value: analytics.totalOrders.toLocaleString('en-IN'),
              note: `${analytics.totalOrdersDelta >= 0 ? '+' : ''}${analytics.totalOrdersDelta}% from last month`,
              trend: analytics.totalOrdersDelta >= 0 ? 'up' : 'down',
              iconSrc: totalOrdersIcon,
            },
            {
              title: 'Total Revenue',
              value: money(analytics.totalRevenue),
              note: `${analytics.totalRevenueDelta >= 0 ? '+' : ''}${analytics.totalRevenueDelta}% from last month`,
              trend: analytics.totalRevenueDelta >= 0 ? 'up' : 'down',
              iconSrc: totalRevenueIcon,
            },
            {
              title: 'Avg. Fulfillment Time',
              value: `${analytics.avgFulfillCurrent.toFixed(1)} Days`,
              note:
                fulfillDelta >= 0
                  ? `${fulfillDelta.toFixed(1)} days faster`
                  : `${Math.abs(fulfillDelta).toFixed(1)} days slower`,
              trend: fulfillDelta >= 0 ? 'up' : 'down',
              iconSrc: fulfillmentTimeIcon,
            },
            {
              title: 'Active Rentals',
              value: analytics.activeRentals.toLocaleString('en-IN'),
              note: 'Currently rented out',
              trend: 'neutral',
              noteIcon: TrendingUp,
              iconSrc: activeRentalsIcon,
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden">
                  <Image
                    src={card.iconSrc}
                    alt=""
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain"
                    priority={false}
                  />
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                >
                  ⋮
                </button>
              </div>
              <p className="mt-3 text-[11px] tracking-wide uppercase text-gray-400 font-medium">
                {card.title}
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {card.value}
              </p>
              <p
                className={`mt-1 text-xs inline-flex items-center gap-1 ${
                  card.trend === 'up'
                    ? 'text-emerald-600'
                    : card.trend === 'down'
                      ? 'text-rose-600'
                      : 'text-gray-500'
                }`}
              >
                {card.noteIcon ? (
                  <card.noteIcon className="w-3.5 h-3.5" />
                ) : card.trend === 'up' ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : card.trend === 'down' ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {card.note}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Order Status Distribution
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Current breakdown of order statuses
            </p>

            <div className="mt-4">
              <StatusDonut rows={analytics.statusRows} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
              {analytics.statusRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${statusTone(row.key)}`}
                    />
                    <p className="text-sm font-medium text-slate-700">
                      {row.label}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{row.pct}%</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Order Health Score
                </p>
                <p className="text-xs text-gray-500">
                  {analytics.deliveredRate}% successful delivery rate this month
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#007BFF] text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Recent Activity
                </h2>
                <p className="text-sm text-gray-500">Latest status changes</p>
              </div>
              <Link
                href="/orders"
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                View All
              </Link>
            </div>
            <ul className="space-y-2.5">
              {analytics.recent.map((item) => {
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 flex items-end justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Image
                        src={statusImage(item.statusKey)}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          moved to{' '}
                          <span
                            className={`font-medium ${statusTextTone(item.statusKey)}`}
                          >
                            {statusLabel(item.statusKey)}
                          </span>
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {item.user}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 shrink-0 self-end">
                      {item.when}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 space-y-2">
              <Link
                href="/orders"
                className="w-full rounded-lg bg-orange-500 text-white text-sm font-medium py-2.5 inline-flex items-center justify-center gap-2 hover:bg-orange-600"
              >
                <Image
                  src={processProductIcon}
                  alt=""
                  width={16}
                  height={16}
                  className="w-4 h-4 object-contain"
                />
                Process New Orders
              </Link>
              <Link
                href="/orders"
                className="w-full rounded-lg border border-gray-300 text-gray-700 text-sm font-medium py-2.5 inline-flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <Truck className="w-4 h-4" />
                Track Shipments
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              {
                key: 'delivered',
                label: 'Delivered',
                iconSrc: deliveredStatusIcon,
              },
              {
                key: 'processing',
                label: 'Processing',
                iconSrc: processingStatusIcon,
              },
              {
                key: 'in_transit',
                label: 'In Transit',
                iconSrc: transitStatusIcon,
              },
              {
                key: 'cancelled',
                label: 'Cancelled',
                iconSrc: cancelledStatusIcon,
              },
            ].map((x) => (
              <div
                key={x.key}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 flex items-center gap-4"
              >
                <Image
                  src={x.iconSrc}
                  alt=""
                  width={56}
                  height={56}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-3xl sm:text-[40px] font-bold text-slate-900 leading-none">
                    {analytics.counts[x.key].toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] sm:text-sm uppercase tracking-wide text-gray-500 mt-1 truncate">
                    {x.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAnalytics;
