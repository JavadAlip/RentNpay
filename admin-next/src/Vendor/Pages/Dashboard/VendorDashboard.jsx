'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { vendorLogout } from '../../../redux/slices/vendorSlice';
import { apiGetMyProducts, apiGetVendorOrders } from '@/service/api';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';

const VendorDashboardPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.vendor);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null;
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([apiGetMyProducts(token), apiGetVendorOrders(token)])
      .then(([pRes, oRes]) => {
        if (cancelled) return;
        setProducts(Array.isArray(pRes?.data?.products) ? pRes.data.products : []);
        setOrders(Array.isArray(oRes?.data) ? oRes.data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await dispatch(vendorLogout());
    router.replace('/vendor-main');
  };

  const computed = useMemo(() => {
    const getOrderGross = (order) => {
      const duration = Number(order?.rentalDuration) || 0;
      const lines = Array.isArray(order?.products) ? order.products : [];
      return lines.reduce((sum, line) => {
        const unit = Number(line?.pricePerDay) || 0;
        const qty = Number(line?.quantity) || 0;
        return sum + unit * qty * duration;
      }, 0);
    };
    const grossRevenue = orders.reduce((s, o) => s + getOrderGross(o), 0);
    const platformCommission = Math.round(grossRevenue * 0.1);
    const otherDeductions = Math.round(grossRevenue * 0.02);
    const netPayout = Math.max(
      0,
      grossRevenue - platformCommission - otherDeductions,
    );
    const rentalCount = products.filter((p) => p?.type === 'Rental').length;
    const sellCount = products.filter((p) => p?.type === 'Sell').length;
    const totalCount = Math.max(1, rentalCount + sellCount);
    const rentalPct = Math.round((rentalCount / totalCount) * 100);
    const sellPct = Math.round((sellCount / totalCount) * 100);
    const servicePct = Math.max(0, 100 - rentalPct - sellPct);
    const transactions = orders.slice(0, 6).map((o) => {
      const gross = getOrderGross(o);
      const commission = Math.round(gross * 0.1);
      const settled = Math.max(0, gross - commission);
      return {
        date: o?.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—',
        id: o?._id ? `ORD-${String(o._id).slice(-6).toUpperCase()}` : 'ORD-—',
        gross: `₹${gross.toLocaleString('en-IN')}`,
        commission: '10%',
        settled: `₹${settled.toLocaleString('en-IN')}`,
      };
    });
    return {
      stats: { grossRevenue, platformCommission, otherDeductions, netPayout },
      revenueDistribution: [
        { label: 'Rentals', value: `${rentalPct}%` },
        { label: 'Direct Sales', value: `${sellPct}%` },
        { label: 'Services', value: `${servicePct}%` },
      ],
      transactions,
    };
  }, [orders, products]);

  const { stats, revenueDistribution, transactions } = computed;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <VendorSidebar onLogout={handleLogout} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <VendorTopBar user={user} onLogout={handleLogout} />

        {/* Scrollable dashboard content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Top stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">
                  GROSS REVENUE
                </p>
                <p className="text-2xl font-semibold text-indigo-600">
                  ₹{stats.grossRevenue.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : 'Total sales before deductions'}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">
                  PLATFORM COMMISSION
                </p>
                <p className="text-2xl font-semibold text-orange-500">
                  ₹{stats.platformCommission.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : 'Fees paid to Rent\'n Pay'}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">
                  OTHER DEDUCTIONS
                </p>
                <p className="text-2xl font-semibold text-red-500">
                  ₹{stats.otherDeductions.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : 'Loan EMIs & refund adjustments'}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">NET PAYOUT</p>
                <p className="text-2xl font-semibold text-emerald-600">
                  ₹{stats.netPayout.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : 'Final income received'}
                </p>
                <button className="mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                  Download PDF Report
                </button>
              </div>
            </div>

            {/* Middle charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Sales Trend */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Sales Trend
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Monthly revenue growth over the last 6 months
                    </p>
                  </div>
                  <button className="text-[11px] px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Filter by Date Range
                  </button>
                </div>
                <div className="mt-2 h-52 md:h-60">
                  <div className="w-full h-full rounded-xl bg-gradient-to-b from-indigo-50 to-white border border-dashed border-indigo-100 flex items-center justify-center">
                    <p className="text-xs text-gray-500">
                      Line chart placeholder – plug real chart library later
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue Distribution */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Revenue Distribution
                </p>
                <p className="text-[11px] text-gray-500 mb-4">
                  Income sources breakdown
                </p>
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 rounded-full bg-orange-100" />
                    <div className="absolute inset-2 rounded-full border-[10px] border-transparent border-t-indigo-500 border-r-orange-400 border-b-emerald-400" />
                    <div className="absolute inset-8 rounded-full bg-white" />
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-xs">
                  {revenueDistribution.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-gray-600"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>{item.label}</span>
                      </div>
                      <span className="font-medium text-gray-800">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Transaction Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Detailed Transaction Summary
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Recent payouts and settlement history
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs md:text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="py-3 text-left font-medium">DATE</th>
                      <th className="py-3 text-left font-medium">ORDER ID</th>
                      <th className="py-3 text-right font-medium">
                        GROSS AMOUNT
                      </th>
                      <th className="py-3 text-right font-medium">
                        COMMISSION (%)
                      </th>
                      <th className="py-3 text-right font-medium">
                        SETTLED AMOUNT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr
                        key={tx.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="py-2.5 text-gray-600">{tx.date}</td>
                        <td className="py-2.5 text-indigo-600 font-medium">
                          {tx.id}
                        </td>
                        <td className="py-2.5 text-right text-gray-700">
                          {tx.gross}
                        </td>
                        <td className="py-2.5 text-right text-gray-600">
                          {tx.commission}
                        </td>
                        <td className="py-2.5 text-right text-emerald-600 font-medium">
                          {tx.settled}
                        </td>
                      </tr>
                    ))}
                    {!loading && transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-500">
                          No transactions yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorDashboardPage;
