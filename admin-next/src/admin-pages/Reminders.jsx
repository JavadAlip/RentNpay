'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGetAllOrders, apiGetAllUsers } from '@/service/api';
import {
  AlarmClock,
  CalendarDays,
  IndianRupee,
  PenLine,
  Phone,
  TrendingUp,
  UserRound,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';

const DAY_MS = 24 * 60 * 60 * 1000;
const money = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;

const normalizeDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};
const formatDate = (value) => {
  const d = normalizeDate(value);
  if (!d) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};
const addDuration = (baseDate, duration, unit) => {
  const start = normalizeDate(baseDate);
  if (!start) return null;
  const safeDuration = Math.max(0, Number(duration || 0));
  const isDay = String(unit || '')
    .toLowerCase()
    .includes('day');
  if (isDay) return new Date(start.getTime() + safeDuration * DAY_MS);
  const end = new Date(start);
  end.setMonth(end.getMonth() + safeDuration);
  return end;
};
const daysRemaining = (targetDate) => {
  const d = normalizeDate(targetDate);
  if (!d) return -1;
  return Math.ceil((d.getTime() - Date.now()) / DAY_MS);
};
const normalizePhone = (raw) => {
  const rawKyc = raw?.kyc || {};
  const profile = raw?.profile || {};
  const v =
    raw?.phone ||
    raw?.phoneNumber ||
    raw?.mobile ||
    raw?.mobileNumber ||
    raw?.contactNumber ||
    raw?.kycMobile ||
    raw?.whatsappNumber ||
    rawKyc?.mobile ||
    rawKyc?.mobileNumber ||
    rawKyc?.phone ||
    rawKyc?.phoneNumber ||
    rawKyc?.contactNumber ||
    profile?.mobile ||
    profile?.mobileNumber ||
    profile?.contactNumber ||
    raw?.userPhone ||
    '';
  return String(v || '').trim();
};
const normalizeName = (raw) => {
  const rawKyc = raw?.kyc || {};
  const profile = raw?.profile || {};
  return String(
    raw?.fullName ||
      raw?.customerName ||
      raw?.name ||
      rawKyc?.fullName ||
      rawKyc?.customerName ||
      rawKyc?.name ||
      profile?.fullName ||
      profile?.customerName ||
      profile?.name ||
      '',
  ).trim();
};
const getUserIdFromOrder = (order) => {
  const userObj = order?.user;
  return (
    userObj?._id ||
    userObj?.id ||
    order?.userId?._id ||
    order?.userId?.id ||
    order?.userId ||
    (typeof userObj === 'string' ? userObj : '') ||
    ''
  );
};
const formatDisplayPhone = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '—';
  if (digits.length === 10)
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) {
    const ten = digits.slice(2);
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  }
  return String(raw || '').trim() || '—';
};
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
};
const badgeClass = (days) => {
  if (days <= 5) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (days <= 12) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};
const badgeIcon = (days) => {
  if (days <= 5) return <AlertCircle className="h-3.5 w-3.5" />;
  if (days <= 12) return <AlarmClock className="h-3.5 w-3.5" />;
  return <CalendarDays className="h-3.5 w-3.5" />;
};
const toDialHref = (rawPhone) => {
  const digits = String(rawPhone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
};

const STATIC_INVESTOR_ROWS = [
  {
    id: 'inv-1',
    name: 'Ramesh Gupta',
    phone: '+91 98765 11111',
    amount: 150000,
    expiryDate: '2026-02-25',
  },
  {
    id: 'inv-2',
    name: 'Anita Desai',
    phone: '+91 98765 22222',
    amount: 250000,
    expiryDate: '2026-03-08',
  },
  {
    id: 'inv-3',
    name: 'Suresh Malhotra',
    phone: '+91 98765 33333',
    amount: 500000,
    expiryDate: '2026-03-20',
  },
  {
    id: 'inv-4',
    name: 'Kavita Nair',
    phone: '+91 98765 44444',
    amount: 100000,
    expiryDate: '2026-02-27',
  },
  {
    id: 'inv-5',
    name: 'Manoj Verma',
    phone: '+91 98765 55555',
    amount: 300000,
    expiryDate: '2026-03-12',
  },
];

const STATIC_LOAN_ROWS = [
  {
    id: 'loan-1',
    name: 'Ramesh Gupta',
    phone: '+91 98765 11111',
    amount: 150000,
    dueDate: '2026-02-25',
  },
  {
    id: 'loan-2',
    name: 'Anita Desai',
    phone: '+91 98765 22222',
    amount: 250000,
    dueDate: '2026-03-08',
  },
  {
    id: 'loan-3',
    name: 'Suresh Malhotra',
    phone: '+91 98765 33333',
    amount: 500000,
    dueDate: '2026-03-20',
  },
  {
    id: 'loan-4',
    name: 'Kavita Nair',
    phone: '+91 98765 44444',
    amount: 100000,
    dueDate: '2026-02-27',
  },
  {
    id: 'loan-5',
    name: 'Manoj Verma',
    phone: '+91 98765 55555',
    amount: 300000,
    dueDate: '2026-03-12',
  },
];

function SectionCard({
  title,
  subtitle,
  chip,
  columns,
  rows,
  amountKey,
  dateKey,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1">
          ₹ {chip} Due Soon
        </span>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-[860px] w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-left font-medium">
                  {c}
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rem = Math.max(0, daysRemaining(row[dateKey]));
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.phone}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">
                    {money(row[amountKey])}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(row[dateKey])}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(rem)}`}
                    >
                      {badgeIcon(rem)}
                      {rem} Days
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={toDialHref(row.phone) || undefined}
                        aria-disabled={!toDialHref(row.phone)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden p-3 space-y-2">
        {rows.map((row) => {
          const rem = Math.max(0, daysRemaining(row[dateKey]));
          return (
            <div key={row.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {row.name}
                  </p>
                  <p className="text-xs text-gray-500">{row.phone}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${badgeClass(rem)}`}
                >
                  {badgeIcon(rem)}
                  {rem} Days
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>Amount: {money(row[amountKey])}</p>
                <p>Date: {formatDate(row[dateKey])}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Reminders() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken')
          : null;
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [ordersRes, usersRes] = await Promise.all([
          apiGetAllOrders(token),
          apiGetAllUsers(token),
        ]);
        setOrders(toArray(ordersRes.data));
        setUsers(toArray(usersRes.data));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load reminders');
        setOrders([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const userPhoneById = useMemo(() => {
    const map = new Map();
    toArray(users).forEach((u) => {
      const key = String(u?._id || u?.id || '').trim();
      if (!key) return;
      const phone = normalizePhone(u);
      if (phone) map.set(key, phone);
    });
    return map;
  }, [users]);
  const userNameById = useMemo(() => {
    const map = new Map();
    toArray(users).forEach((u) => {
      const key = String(u?._id || u?.id || '').trim();
      if (!key) return;
      const name = normalizeName(u);
      if (name) map.set(key, name);
    });
    return map;
  }, [users]);

  const tenureRows = useMemo(() => {
    const rows = [];
    (orders || []).forEach((order) => {
      const status = String(order?.status || '').toLowerCase();
      if (!['delivered', 'completed', 'confirmed', 'shipped'].includes(status))
        return;

      const orderStartDate =
        order?.deliveredAt || order?.updatedAt || order?.createdAt;
      const userId = String(getUserIdFromOrder(order) || '');
      const customerName =
        normalizeName(order?.user) ||
        order?.name ||
        userNameById.get(userId) ||
        normalizeName(order) ||
        'Customer';
      const userPhone = userId ? userPhoneById.get(userId) : '';
      const customerPhoneRaw =
        userPhone || normalizePhone(order?.user) || normalizePhone(order);
      const customerPhone = formatDisplayPhone(customerPhoneRaw);

      (order?.products || []).forEach((item, index) => {
        const duration = Number(
          item?.rentalDuration || order?.rentalDuration || 0,
        );
        if (!Number.isFinite(duration) || duration <= 0) return;

        const tenureUnit =
          item?.tenureUnit ||
          item?.periodUnit ||
          order?.tenureUnit ||
          item?.rentalDurationUnit ||
          order?.rentalDurationUnit ||
          'month';
        const endDate = addDuration(orderStartDate, duration, tenureUnit);
        const rem = daysRemaining(endDate);
        if (rem < 0) return;

        const productObj =
          item?.product && typeof item.product === 'object'
            ? item.product
            : null;
        const productName =
          productObj?.productName ||
          productObj?.title ||
          item?.productName ||
          'Rental Product';
        const productImage = productObj?.image || item?.image || '';

        rows.push({
          id: `${order?._id || 'ord'}-${index}`,
          customerName,
          customerPhone,
          customerPhoneRaw,
          productName,
          productImage,
          tenureLabel: `${duration} ${String(tenureUnit).toLowerCase().includes('day') ? 'Days' : 'Months'}`,
          endDate,
          remainingDays: rem,
        });
      });
    });
    return rows.sort((a, b) => a.remainingDays - b.remainingDays).slice(0, 30);
  }, [orders, userNameById, userPhoneById]);

  const urgentCount = tenureRows.filter((r) => r.remainingDays <= 5).length;
  const activeRentals = tenureRows.length;
  const activeInvestors = STATIC_INVESTOR_ROWS.length;
  const investorDueSoon = STATIC_INVESTOR_ROWS.filter(
    (r) => daysRemaining(r.expiryDate) <= 12,
  ).length;
  const loanDueSoon = STATIC_LOAN_ROWS.filter(
    (r) => daysRemaining(r.dueDate) <= 12,
  ).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Reminders & Expiry Tracking
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor upcoming rental expirations and investor payout schedules
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-rose-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlarmClock className="h-4 w-4" />
            </span>
            <p className="text-xs text-gray-500">Urgent ( &lt; 5 Days )</p>
          </div>
          <p className="text-3xl font-semibold text-rose-600 mt-1">
            {urgentCount}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50"
              style={{ color: '#F97316' }}
            >
              <TrendingUp className="h-4 w-4" />
            </span>
            <p className="text-xs text-gray-500">Active Rentals</p>
          </div>
          <p
            className="text-3xl font-semibold mt-1"
            style={{ color: '#F97316' }}
          >
            {activeRentals}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <IndianRupee className="h-4 w-4" />
            </span>
            <p className="text-xs text-gray-500">Active Investors</p>
          </div>
          <p className="text-3xl font-semibold text-blue-600 mt-1">
            {activeInvestors}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Tenure Expiry Reminders
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Rental contracts nearing completion
            </p>
          </div>
          {/* <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1">
            {urgentCount} Urgent
          </span> */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-[#F97316] text-xs font-medium px-3 py-1 border border-[#FFD6A8]">
            <AlertCircle size={12} className="text-[#F97316]" />
            {urgentCount} Urgent
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-gray-500 text-center">
            Loading reminders...
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Customer Info
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Product</th>
                    <th className="px-4 py-3 text-left font-medium">Tenure</th>
                    <th className="px-4 py-3 text-left font-medium">
                      End Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Days Remaining
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenureRows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {row.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {row.customerPhone}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {row.productImage ? (
                            <img
                              src={row.productImage}
                              alt=""
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-gray-400">
                              <UserRound className="h-4 w-4" />
                            </span>
                          )}
                          <p className="font-medium text-gray-800">
                            {row.productName}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.tenureLabel}
                      </td>
                      <td className="px-4 py-3 text-gray-600 inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(row.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(row.remainingDays)}`}
                        >
                          {badgeIcon(row.remainingDays)}
                          {row.remainingDays} Days
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={toDialHref(row.customerPhoneRaw) || undefined}
                            aria-disabled={!toDialHref(row.customerPhoneRaw)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!tenureRows.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        No upcoming tenure expiry reminders found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-3 space-y-2">
              {tenureRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {row.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.customerPhone}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${badgeClass(row.remainingDays)}`}
                    >
                      {badgeIcon(row.remainingDays)}
                      {row.remainingDays} Days
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-800">
                    {row.productName}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {row.tenureLabel} • Ends {formatDate(row.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <SectionCard
        title="Public Investor Expiry Reminders"
        subtitle="Investment contracts due for payout"
        chip={investorDueSoon}
        columns={['Investor Info', 'Invested Amount', 'Expiry Date', 'Status']}
        rows={STATIC_INVESTOR_ROWS}
        amountKey="amount"
        dateKey="expiryDate"
      />

      <SectionCard
        title="Loans Reminders"
        subtitle="Loans by Vendors"
        chip={loanDueSoon}
        columns={['Vendor Info', 'Loan Amount', 'Due Date', 'Status']}
        rows={STATIC_LOAN_ROWS}
        amountKey="amount"
        dateKey="dueDate"
      />
    </div>
  );
}
