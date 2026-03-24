'use client';

import { useEffect, useMemo, useState } from 'react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { apiGetVendorCustomers } from '@/service/api';
import { useSelector } from 'react-redux';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function VendorCustomersPage() {
  const { user, token } = useSelector((s) => s.vendor);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({
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
  });
  const [search, setSearch] = useState('');

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
        setTotals(res.data?.totals || totals);
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
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.customerCode || '')
          .toLowerCase()
          .includes(q) ||
        String(r.fullName || '')
          .toLowerCase()
          .includes(q) ||
        String(r.emailAddress || '')
          .toLowerCase()
          .includes(q),
    );
  }, [rows, search]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f3f5f9]">
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track customer lifecycle, revenue breakdown, and lifetime value
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-blue-100 p-4">
              <p className="text-xs text-gray-500">Total Customers</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">
                {totals.totalCustomers}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 p-4">
              <p className="text-xs text-gray-500">Top Customers</p>
              <p className="mt-2 text-3xl font-semibold text-orange-500">
                {totals.topCustomers}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100 p-4">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">
                {money(totals.revenue)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-violet-100 p-4">
              <p className="text-xs text-gray-500">Avg. Tenure</p>
              <p className="mt-2 text-3xl font-semibold text-violet-600">
                {totals.avgTenureMonths} mos
              </p>
            </div>
          </div>

          <div className="mt-5 bg-white rounded-2xl border border-gray-200 p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
              {error}
            </div>
          ) : (
            <div className="mt-4 bg-white rounded-2xl border border-gray-200 overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Customer ID</th>
                    <th className="px-3 py-3 text-left font-medium">Customer Profile</th>
                    <th className="px-3 py-3 text-left font-medium">Tenure</th>
                    <th className="px-3 py-3 text-left font-medium">Service</th>
                    <th className="px-3 py-3 text-left font-medium">New (Buy)</th>
                    <th className="px-3 py-3 text-left font-medium">Used (Buy)</th>
                    <th className="px-3 py-3 text-left font-medium">Rent</th>
                    <th className="px-3 py-3 text-left font-medium">Deposit</th>
                    <th className="px-3 py-3 text-left font-medium">Shipping</th>
                    <th className="px-3 py-3 text-left font-medium">Lifetime Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr key={c._id} className={idx % 2 ? 'bg-white' : 'bg-[#fcfdff]'}>
                      <td className="px-3 py-3 font-medium text-gray-700">{c.customerCode}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">{c.fullName}</div>
                        <div className="text-xs text-gray-500">{c.emailAddress}</div>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {c.lastOrderAt
                          ? new Date(c.lastOrderAt).toLocaleDateString('en-GB')
                          : '-'}
                      </td>
                      <td className="px-3 py-3">{money(c.service)}</td>
                      <td className="px-3 py-3">{money(c.newBuy)}</td>
                      <td className="px-3 py-3">{money(c.usedBuy)}</td>
                      <td className="px-3 py-3">{money(c.rent)}</td>
                      <td className="px-3 py-3 text-blue-600 font-medium">{money(c.deposit)}</td>
                      <td className="px-3 py-3">{money(c.shipping)}</td>
                      <td className="px-3 py-3 text-emerald-600 font-semibold">
                        {money(c.lifetimeValue)}
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-[#24364e] text-white">
                  <tr>
                    <td colSpan={3} className="px-3 py-3 font-semibold">
                      GRAND TOTAL
                    </td>
                    <td className="px-3 py-3">{money(totals.service)}</td>
                    <td className="px-3 py-3">{money(totals.newBuy)}</td>
                    <td className="px-3 py-3">{money(totals.usedBuy)}</td>
                    <td className="px-3 py-3">{money(totals.rent)}</td>
                    <td className="px-3 py-3 text-blue-200">{money(totals.deposit)}</td>
                    <td className="px-3 py-3">{money(totals.shipping)}</td>
                    <td className="px-3 py-3 text-emerald-300 font-semibold">
                      {money(totals.lifetime)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

