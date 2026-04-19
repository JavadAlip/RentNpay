'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllUsers } from '@/redux/slices/adminSlice';
import Link from 'next/link';
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

/** Lifetime without at-home service (not implemented yet). */
function partsLifetime(u) {
  return (
    Number(u.rent || 0) +
    Number(u.newBuy || 0) +
    Number(u.usedBuy || 0) +
    Number(u.deposit || 0) +
    Number(u.shipping || 0)
  );
}

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

const Users = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, error } = useSelector((state) => state.admin);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = (e) => {
      const root = document.getElementById(`user-actions-${openMenuId}`);
      if (root && !root.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuId]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users || []).filter((u) => {
      const custId =
        u.customerNumber != null && u.customerNumber > 0
          ? `cust-${String(u.customerNumber).padStart(3, '0')}`
          : '';
      const phone = String(u.kycMobile || '').toLowerCase();
      const matchSearch =
        !q ||
        String(u.fullName || '')
          .toLowerCase()
          .includes(q) ||
        String(u.emailAddress || '')
          .toLowerCase()
          .includes(q) ||
        String(u._id || '')
          .toLowerCase()
          .includes(q) ||
        custId.includes(q) ||
        phone.includes(q.replace(/\s/g, ''));

      if (!matchSearch) return false;
      if (filterType === 'top') return Number(u.ordersCount || 0) >= 2;
      if (filterType === 'new') {
        if (!u.createdAt) return false;
        const age = Date.now() - new Date(u.createdAt).getTime();
        return age <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [users, query, filterType]);

  const stats = useMemo(() => {
    const list = users || [];
    const totalCustomers = list.length;
    const topCustomers = list.filter((u) => Number(u.ordersCount || 0) >= 2).length;
    const revenue = list.reduce((s, u) => s + partsLifetime(u), 0);
    const avgTenureMonths = totalCustomers
      ? Math.round(
          list.reduce((s, u) => {
            if (!u.createdAt) return s;
            const months = Math.max(
              0,
              Math.floor(
                (Date.now() - new Date(u.createdAt).getTime()) /
                  (30 * 24 * 60 * 60 * 1000),
              ),
            );
            return s + months;
          }, 0) / totalCustomers,
        )
      : 0;
    return { totalCustomers, topCustomers, revenue, avgTenureMonths };
  }, [users]);

  const footerTotals = useMemo(() => {
    return filteredUsers.reduce(
      (acc, u) => ({
        newBuy: acc.newBuy + Number(u.newBuy || 0),
        usedBuy: acc.usedBuy + Number(u.usedBuy || 0),
        rent: acc.rent + Number(u.rent || 0),
        deposit: acc.deposit + Number(u.deposit || 0),
        shipping: acc.shipping + Number(u.shipping || 0),
        lifetime: acc.lifetime + partsLifetime(u),
      }),
      {
        newBuy: 0,
        usedBuy: 0,
        rent: 0,
        deposit: 0,
        shipping: 0,
        lifetime: 0,
      },
    );
  }, [filteredUsers]);

  if (usersLoading) {
    return (
      <div className="flex justify-center py-14">
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

  return (
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
              {stats.totalCustomers}
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
              {stats.topCustomers}
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
              {money(stats.revenue)}
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
              {stats.avgTenureMonths} mos
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
              {filteredUsers.map((u) => {
                const custId =
                  u.customerNumber != null && u.customerNumber > 0
                    ? `CUST-${String(u.customerNumber).padStart(3, '0')}`
                    : '—';
                return (
                  <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900 font-mono text-xs sm:text-sm">
                      {custId}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{u.fullName || '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatKycPhone(u.kycMobile)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {formatTenureDate(u.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                      {money(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800 tabular-nums">
                      {money(u.newBuy)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800 tabular-nums">
                      {money(u.usedBuy)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800 tabular-nums">
                      {money(u.rent)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 font-medium tabular-nums">
                      {money(u.deposit)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800 tabular-nums">
                      {money(u.shipping)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold tabular-nums">
                      {money(partsLifetime(u))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div id={`user-actions-${u._id}`} className="relative inline-flex">
                        <button
                          type="button"
                          aria-label="Row actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId((id) => (id === u._id ? null : u._id));
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === u._id && (
                          <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg text-left">
                            <Link
                              href={`/users/${u._id}`}
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
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                    No users found for selected filters.
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
                  {money(0)}
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
  );
};

export default Users;
