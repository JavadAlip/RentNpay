'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { apiGetVendorCustomers } from '@/service/api';
import { useSelector } from 'react-redux';
import {
  Users as UsersIcon,
  Award,
  TrendingUp,
  CalendarDays,
  Search,
  Calendar,
  MoreVertical,
} from 'lucide-react';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function formatTenureDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatKycPhone(raw) {
  const s = String(raw || '').replace(/\D/g, '');
  if (!s) return '—';
  if (s.length === 10) return `+91 ${s.slice(0, 5)} ${s.slice(5)}`;
  if (s.length > 10 && s.startsWith('91')) {
    const rest = s.slice(2);
    if (rest.length === 10) return `+91 ${rest.slice(0, 5)} ${rest.slice(5)}`;
  }
  return raw;
}

const emptyTotals = {
  totalCustomers: 0,
  topCustomers: 0,
  revenue: 0,
  avgTenureMonths: 0,
  service: 0,
  newBuy: 0,
  usedBuy: 0,
  rent: 0,
  deposit: 0,
  shipping: 0,
  lifetime: 0,
};

export default function VendorCustomersPage() {
  const { user, token } = useSelector((s) => s.vendor);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(emptyTotals);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!openMenuId) return;
    const close = (e) => {
      const root = document.getElementById(`vendor-customer-actions-${openMenuId}`);
      if (root && !root.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuId]);

  useEffect(() => {
    let mounted = true;
    const authToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null);
    if (!authToken) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }

    setLoading(true);
    apiGetVendorCustomers(authToken)
      .then((res) => {
        if (!mounted) return;
        setRows(res.data?.customers || []);
        setTotals(res.data?.totals ? { ...emptyTotals, ...res.data.totals } : emptyTotals);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Failed to load customers.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const phone = String(r.kycMobile || '').toLowerCase();
      const matchSearch =
        !q ||
        String(r.customerCode || '')
          .toLowerCase()
          .includes(q) ||
        String(r.fullName || '')
          .toLowerCase()
          .includes(q) ||
        String(r.emailAddress || '')
          .toLowerCase()
          .includes(q) ||
        String(r._id || '')
          .toLowerCase()
          .includes(q) ||
        phone.includes(q.replace(/\s/g, ''));

      if (!matchSearch) return false;
      if (filterType === 'top') return Number(r.ordersCount || 0) >= 2;
      if (filterType === 'new') {
        if (!r.lastOrderAt) return false;
        const age = Date.now() - new Date(r.lastOrderAt).getTime();
        return age <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [rows, search, filterType]);

  const footerTotals = useMemo(
    () =>
      filtered.reduce(
        (acc, c) => ({
          service: acc.service + Number(c.service || 0),
          newBuy: acc.newBuy + Number(c.newBuy || 0),
          usedBuy: acc.usedBuy + Number(c.usedBuy || 0),
          rent: acc.rent + Number(c.rent || 0),
          deposit: acc.deposit + Number(c.deposit || 0),
          shipping: acc.shipping + Number(c.shipping || 0),
          lifetime: acc.lifetime + Number(c.lifetimeValue || 0),
        }),
        {
          service: 0,
          newBuy: 0,
          usedBuy: 0,
          rent: 0,
          deposit: 0,
          shipping: 0,
          lifetime: 0,
        },
      ),
    [filtered],
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f3f5f9]">
          {loading ? (
            <div className="flex justify-center py-14">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track customer lifecycle with dynamic platform data
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-5 flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UsersIcon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Total Customers</p>
                    <p className="text-3xl font-semibold text-blue-700 mt-1">
                      {totals.totalCustomers}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-5 flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Top Customers</p>
                    <p className="text-3xl font-semibold text-orange-600 mt-1">
                      {totals.topCustomers}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-emerald-100 p-4 sm:p-5 flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-3xl font-semibold text-emerald-600 mt-1">
                      {money(totals.revenue)}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-violet-100 p-4 sm:p-5 flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Avg. Tenure</p>
                    <p className="text-3xl font-semibold text-violet-600 mt-1">
                      {totals.avgTenureMonths} mos
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or ID..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="relative inline-flex items-center">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="appearance-none pl-3 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[160px]"
                    >
                      <option value="all">All Customers</option>
                      <option value="top">Top Customers</option>
                      <option value="new">New (Last 30 days)</option>
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      ▼
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[1200px] w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-gray-500 text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 text-left font-medium">Customer ID</th>
                        <th className="px-4 py-3 text-left font-medium">Customer Profile</th>
                        <th className="px-4 py-3 text-left font-medium">Tenure</th>
                        <th className="px-4 py-3 text-right font-medium">Service</th>
                        <th
                          className="px-4 py-3 text-right font-medium"
                          title="Sum of checkout totals for Sell listings with condition Brand New."
                        >
                          New (Buy)
                        </th>
                        <th
                          className="px-4 py-3 text-right font-medium"
                          title="Sum of checkout totals for Sell listings that are not Brand New (e.g. Refurbished, Like New)."
                        >
                          Used (Buy)
                        </th>
                        <th
                          className="px-4 py-3 text-right font-medium"
                          title="Sum of checkout totals for rental lines (full selected tenure × quantity)."
                        >
                          Rent
                        </th>
                        <th className="px-4 py-3 text-right font-medium">Deposit</th>
                        <th className="px-4 py-3 text-right font-medium">Shipping</th>
                        <th className="px-4 py-3 text-right font-medium">Lifetime Value</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr key={c._id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900 font-mono text-xs sm:text-sm">
                            {c.customerCode || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{c.fullName || '—'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatKycPhone(c.kycMobile)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {formatTenureDate(c.lastOrderAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                            {money(c.service)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 tabular-nums">
                            {money(c.newBuy)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 tabular-nums">
                            {money(c.usedBuy)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 tabular-nums">
                            {money(c.rent)}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600 font-medium tabular-nums">
                            {money(c.deposit)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 tabular-nums">
                            {money(c.shipping)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-semibold tabular-nums">
                            {money(c.lifetimeValue)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div
                              id={`vendor-customer-actions-${c._id}`}
                              className="relative inline-flex"
                            >
                              <button
                                type="button"
                                aria-label="Row actions"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId((id) => (id === c._id ? null : c._id));
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === c._id && (
                                <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg text-left">
                                  <Link
                                    href={`/vendor/customers/${c._id}`}
                                    className="block px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    View details
                                  </Link>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                            No customers found for selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-800 text-white text-sm">
                        <td className="px-4 py-3 font-semibold" colSpan={3}>
                          GRAND TOTAL
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-200">
                          {money(footerTotals.service)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {money(footerTotals.newBuy)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {money(footerTotals.usedBuy)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {money(footerTotals.rent)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-200 tabular-nums">
                          {money(footerTotals.deposit)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {money(footerTotals.shipping)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-300 tabular-nums">
                          {money(footerTotals.lifetime)}
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
