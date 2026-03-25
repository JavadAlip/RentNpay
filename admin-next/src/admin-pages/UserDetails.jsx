'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGetAdminUserDetails } from '@/service/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function UserDetails({ userId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

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

  const kycDocs = useMemo(() => {
    const base = data?.kycDocuments || [];
    if (base.length) return base;
    return [
      { id: 'gst', title: 'GST Certificate', status: 'Not Uploaded' },
      { id: 'pan', title: 'PAN Document', status: 'Not Uploaded' },
      { id: 'shop', title: 'Shop Invoice', status: 'Not Uploaded' },
    ];
  }, [data]);

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

  const { user, summary, financials, activeRentals, orderHistory } = data;
  const initials = String(user.fullName || 'U')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{user.fullName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{user.customerCode}</p>
              <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
                <span>{user.emailAddress}</span>
                <span>
                  Since{' '}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-GB')
                    : '-'}
                </span>
                <span>{summary?.tenureMonths || 0} months tenure</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center w-full sm:w-auto">
            <div className="rounded-xl border border-gray-200 px-3 py-2">
              <p className="text-[11px] text-gray-500">Orders</p>
              <p className="text-sm font-semibold">{summary?.totalOrders || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-2">
              <p className="text-[11px] text-gray-500">Active Rentals</p>
              <p className="text-sm font-semibold">{summary?.activeRentals || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-2">
              <p className="text-[11px] text-gray-500">Rent Value</p>
              <p className="text-sm font-semibold">{money(financials?.rent || 0)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-2">
              <p className="text-[11px] text-gray-500">Total Value</p>
              <p className="text-sm font-semibold">{money(summary?.totalAmount || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Active Rentals</h2>
        </div>
        <div className="p-4 space-y-3">
          {activeRentals?.length ? (
            activeRentals.map((item) => {
              const progress = item.totalMonths
                ? Math.min(100, Math.round((item.elapsedMonths / item.totalMonths) * 100))
                : 0;
              return (
                <div key={`${item.orderId}-${item.productName}`} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.startDate
                          ? new Date(item.startDate).toLocaleDateString('en-GB')
                          : '-'}{' '}
                        -{' '}
                        {item.endDate
                          ? new Date(item.endDate).toLocaleDateString('en-GB')
                          : '-'}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {money(item.monthlyAmount)}/month
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                    <div className="rounded-md bg-blue-50 border border-blue-100 px-2 py-1.5">
                      <p className="text-gray-500">Total Tenure</p>
                      <p className="font-semibold">{item.totalMonths} Months</p>
                    </div>
                    <div className="rounded-md bg-orange-50 border border-orange-100 px-2 py-1.5">
                      <p className="text-gray-500">Remaining</p>
                      <p className="font-semibold">{item.monthsLeft} Months</p>
                    </div>
                    <div className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-1.5">
                      <p className="text-gray-500">Rent Amount</p>
                      <p className="font-semibold">{money(item.rentAmount)}</p>
                    </div>
                    <div className="rounded-md bg-violet-50 border border-violet-100 px-2 py-1.5">
                      <p className="text-gray-500">Deposit</p>
                      <p className="font-semibold">{money(item.deposit)}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">No active rentals.</div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Order History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Transaction ID</th>
                <th className="px-3 py-2.5 text-left font-medium">Date</th>
                <th className="px-3 py-2.5 text-left font-medium">Amount</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-3 py-2.5 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory?.length ? (
                orderHistory.map((o) => (
                  <tr key={o._id} className="border-t border-gray-100">
                    <td className="px-3 py-2.5 text-gray-700">
                      TRN-{String(o._id).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {o.date ? new Date(o.date).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900">
                      {money(o.amount)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] border border-gray-200 bg-gray-50 text-gray-700 capitalize">
                        {o.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{o.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">KYC Documents</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {kycDocs.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-24 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                Preview
              </div>
              <div className="p-3">
                <p className="font-medium text-sm text-gray-900">{doc.title}</p>
                <p className="text-xs text-gray-500 mt-1">{doc.status}</p>
                <button className="mt-2 px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Support Tickets</h2>
        </div>
        <div className="p-4 space-y-2.5">
          {supportTickets.length ? (
            supportTickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-gray-200 px-3 py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.subject || 'Ticket'}</p>
                  <p className="text-xs text-gray-500">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : '-'}
                  </p>
                </div>
                <button className="px-3 py-1.5 rounded-md border border-gray-300 text-xs">
                  View Details
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">
              No support tickets available for this customer yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

