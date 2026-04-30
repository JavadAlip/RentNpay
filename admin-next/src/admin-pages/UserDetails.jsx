'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiGetAdminUserDetails } from '@/service/api';
import {
  ChevronLeft,
  CheckCircle2,
  LayoutGrid,
  Sofa,
  ClipboardList,
  Shield,
  LifeBuoy,
  X,
  Package,
  Building2,
  Clock3,
} from 'lucide-react';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function mediaUrl(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(String(src))) return String(src);
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(
    /\/api\/?$/i,
    '',
  );
  const path = String(src).startsWith('/') ? String(src) : `/${src}`;
  return `${base}${path}`;
}

function formatShortDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatLongDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelativeTime(iso) {
  const d = iso ? new Date(iso) : null;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return 'just now';
  if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} day ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'rentals', label: 'Active Rentals', icon: Sofa },
  { id: 'orders', label: 'Order History', icon: ClipboardList },
  { id: 'kyc', label: 'KYC Vault', icon: Shield },
  { id: 'support', label: 'Support Tickets', icon: LifeBuoy },
];

export default function UserDetails({ userId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [kycPreview, setKycPreview] = useState(null);

  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    if (!userId) {
      setError('Invalid user id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    apiGetAdminUserDetails(userId, token)
      .then((res) => {
        if (!mounted) return;
        setData(res.data || null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Failed to load user details.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  const supportTickets = useMemo(() => data?.supportTickets || [], [data]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
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

  if (!data?.user) {
    return (
      <div className="p-6 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl">
        No details found.
      </div>
    );
  }

  const {
    user,
    summary,
    financials,
    activeRentals,
    orderHistory,
    customerKyc,
    profilePhone,
  } = data;
  const initials = String(user.fullName || 'U')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const kycStatus = customerKyc?.status || 'not_submitted';
  const kycVerified = kycStatus === 'approved';
  const phone =
    String(profilePhone || customerKyc?.contactNumber || '').trim() || '—';

  const kycDocs = [
    {
      key: 'aadhaarFront',
      title: 'Aadhaar — front',
      src: customerKyc?.aadhaarFront || '',
    },
    {
      key: 'aadhaarBack',
      title: 'Aadhaar — back',
      src: customerKyc?.aadhaarBack || '',
    },
    {
      key: 'panCard',
      title: 'PAN card',
      src: customerKyc?.panCard || '',
    },
  ];

  const typeBadge = (t) => {
    const v = String(t || '').toLowerCase();
    if (v === 'buy') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return 'bg-blue-50 text-blue-800 border-blue-200';
  };

  const statusBadge = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'delivered' || v === 'completed' || v === 'confirmed') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (v === 'cancelled') return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {user.fullName}
                </h1>
                {kycVerified ? (
                  <span
                    className="inline-flex items-center gap-0.5 text-blue-600"
                    title="KYC verified"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-500 font-mono">
                  {user.customerCode}
                </p>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                    kycVerified
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  KYC: {kycStatus.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-3 text-sm text-gray-600 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1">
                <span>{user.emailAddress}</span>
                <span>{phone}</span>
                <span className="text-gray-500">
                  Joined{' '}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 flex flex-wrap gap-1 sm:gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
                tab === id
                  ? 'border-orange-200 bg-orange-50 text-orange-800'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Recent transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {(orderHistory || []).slice(0, 8).map((o) => (
                  <tr key={o._id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">
                      TXN-{String(o._id).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {formatLongDate(o.date)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                      {money(o.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${typeBadge(
                          o.type,
                        )}`}
                      >
                        {o.type || 'Rent'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${statusBadge(
                          o.status,
                        )}`}
                      >
                        {o.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[280px]">
                      {o.description}
                    </td>
                  </tr>
                ))}
                {(!orderHistory || orderHistory.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'rentals' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Sofa className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Active Rentals</h2>
            {/* <span className="text-xs text-gray-500">
              (Same as customer &quot;My rentals&quot; — delivered lines only)
            </span> */}
          </div>
          <div className="p-4 space-y-4">
            {activeRentals?.length ? (
              activeRentals.map((item, idx) => {
                const isDay = item.tenureUnit === 'day';
                const rentLabel = isDay
                  ? `${money(item.monthlyAmount)}/day`
                  : `${money(item.monthlyAmount)}/mo`;
                const totalTenureLabel = isDay
                  ? `${item.duration} day${item.duration === 1 ? '' : 's'}`
                  : `${item.duration} month${item.duration === 1 ? '' : 's'}`;
                const rem = Math.max(0, item.remainingDays);
                const remMonths = Math.max(0, Math.ceil(rem / 30));
                const remLabel = isDay
                  ? `${rem} day${rem === 1 ? '' : 's'}`
                  : `${remMonths} month${remMonths === 1 ? '' : 's'}`;
                const img = mediaUrl(item.productImage);

                return (
                  <div
                    key={`${String(item.orderId)}-${idx}`}
                    className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="w-full sm:w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              {item.productName}
                            </p>
                            {item.category ? (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.category}
                              </p>
                            ) : null}
                          </div>
                          <p className="text-lg font-bold text-gray-900 whitespace-nowrap">
                            {rentLabel}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4 text-xs">
                          <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-2">
                            <p className="text-gray-500 font-medium uppercase tracking-wide">
                              Total tenure
                            </p>
                            <p className="font-semibold text-gray-900 mt-0.5 capitalize">
                              {totalTenureLabel}
                            </p>
                          </div>
                          <div className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-2">
                            <p className="text-gray-500 font-medium uppercase tracking-wide">
                              Remaining
                            </p>
                            <p className="font-semibold text-gray-900 mt-0.5">
                              {remLabel}
                            </p>
                          </div>
                          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                            <p className="text-gray-500 font-medium uppercase tracking-wide">
                              Security deposit
                            </p>
                            <p className="font-semibold text-emerald-900 mt-0.5">
                              {money(item.deposit)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                            <p className="text-gray-500 font-medium uppercase tracking-wide">
                              Care tax
                            </p>
                            <p className="font-semibold text-violet-900 mt-0.5">
                              {money(item.careTax)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] text-gray-500 uppercase tracking-wide mb-1">
                            <span>Start {formatShortDate(item.startDate)}</span>
                            <span>End {formatShortDate(item.endDate)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{
                                width: `${Math.round(item.progressPct || 0)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Total rent for tenure:{' '}
                          <span className="font-semibold text-gray-800">
                            {money(item.lineTotalRent)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 py-6 text-center">
                No active rentals — nothing delivered yet, or no lease time
                remaining.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Order history</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderHistory?.length ? (
                  orderHistory.map((o) => (
                    <tr key={o._id} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">
                        TXN-{String(o._id).slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">
                        {formatLongDate(o.date)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                        {money(o.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${typeBadge(
                            o.type,
                          )}`}
                        >
                          {o.type || 'Rent'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${statusBadge(
                            o.status,
                          )}`}
                        >
                          {o.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-xs">
                        {o.description}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'kyc' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">KYC documents</h2>
            {/* <span className="text-xs text-gray-500">View only</span> */}
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {kycDocs.map((doc) => {
              const src = mediaUrl(doc.src);
              const has = Boolean(doc.src);
              return (
                <div
                  key={doc.key}
                  className="rounded-2xl border border-gray-200 overflow-hidden flex flex-col bg-gray-50/50"
                >
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
                    {has ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={doc.title}
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      <p className="text-sm text-gray-400 px-4 text-center">
                        Not uploaded
                      </p>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-2 flex-1 bg-white border-t border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-gray-900">
                        {doc.title}
                      </p>
                      {kycVerified && has ? (
                        <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-0.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500 capitalize shrink-0">
                          {kycStatus}
                        </span>
                      )}
                    </div>
                    {customerKyc?.submittedAt ? (
                      <p className="text-xs text-gray-500">
                        Uploaded: {formatLongDate(customerKyc.submittedAt)}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={!has}
                      onClick={() =>
                        has && setKycPreview({ title: doc.title, url: src })
                      }
                      className="mt-auto w-full py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!customerKyc ? (
            <p className="px-4 pb-4 text-sm text-gray-500">
              No KYC submission for this customer.
            </p>
          ) : null}
        </div>
      )}

      {tab === 'support' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Support tickets</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Product issue reports from this customer&apos;s orders (same data
              as Customer Queries).
            </p>
          </div>
          <div className="p-4 space-y-3">
            {supportTickets.length ? (
              supportTickets.map((t) => {
                const solved = t.status === 'solved';
                return (
                  <div
                    key={`${t.orderId}-${t._id}`}
                    className="rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-gray-800">
                          {t.queryId}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                            solved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {solved ? 'Resolved' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {t.productName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-700 mt-1 line-clamp-2">
                        {t.message}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5 shrink-0" />
                          {formatRelativeTime(t.createdAt)}
                          <span className="text-gray-400">·</span>
                          Created: {formatLongDate(t.createdAt)}
                        </span>
                        {t.assignedStore ? (
                          <span className="inline-flex items-center gap-1 text-blue-600">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            {t.assignedStore}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      href={`/system/tickets/${t.orderId}/${t._id}`}
                      className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-800 hover:bg-gray-50 whitespace-nowrap"
                    >
                      View details
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">
                No support tickets for this customer yet. Issues raised from{' '}
                <Link
                  href="/system/tickets"
                  className="text-orange-600 font-medium hover:underline"
                >
                  Customer Queries
                </Link>{' '}
                will appear here when linked to their orders.
              </div>
            )}
          </div>
        </div>
      )}

      {kycPreview ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-label={kycPreview.title}
          onClick={() => setKycPreview(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
              <p className="font-semibold text-gray-900">{kycPreview.title}</p>
              <button
                type="button"
                onClick={() => setKycPreview(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto bg-gray-900 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kycPreview.url}
                alt={kycPreview.title}
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
