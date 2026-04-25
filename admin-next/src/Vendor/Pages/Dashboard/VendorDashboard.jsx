'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { vendorLogout } from '../../../redux/slices/vendorSlice';
import { apiGetMyProducts, apiGetVendorOrders } from '@/service/api';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import grossRev from '@/assets/icons/gross-rev.png';
import platformComm from '@/assets/icons/platform-comm.png';
import netPayout from '@/assets/icons/net-payout.png';
import jsPDF from 'jspdf';
import downLoad from '@/assets/icons/download.png';
import DateIcon from '@/assets/icons/date.png';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const VendorDashboardPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.vendor);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

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
        setProducts(
          Array.isArray(pRes?.data?.products) ? pRes.data.products : [],
        );
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

  const handleDownloadPDF = () => {
    const pdf = new jsPDF();

    let y = 20;

    pdf.setFontSize(16);
    pdf.text('Vendor Dashboard Report', 14, y);

    y += 10;
    pdf.setFontSize(12);

    pdf.text(
      `Gross Revenue: ₹${stats.grossRevenue.toLocaleString('en-IN')}`,
      14,
      (y += 8),
    );

    pdf.text(
      `Platform Commission: ₹${stats.platformCommission.toLocaleString('en-IN')}`,
      14,
      (y += 8),
    );

    pdf.text(
      `Net Payout: ₹${stats.netPayout.toLocaleString('en-IN')}`,
      14,
      (y += 8),
    );

    y += 10;
    pdf.text('Transactions:', 14, y);

    y += 8;

    transactions.forEach((tx) => {
      pdf.text(
        `${tx.date} | ${tx.id} | ${tx.gross} | ${tx.commission} | ${tx.settled}`,
        14,
        y,
      );
      y += 7;
    });

    pdf.save('dashboard-report.pdf');
  };
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
    const filteredOrders = orders.filter((o) => {
      if (!selectedDate) return true;

      const orderDate = new Date(o.createdAt).toDateString();
      const filterDate = new Date(selectedDate).toDateString();

      return orderDate === filterDate;
    });
    const transactions = filteredOrders.slice(0, 6).map((o) => {
      const gross = getOrderGross(o);
      const commission = Math.round(gross * 0.1);
      const settled = Math.max(0, gross - commission);
      return {
        // date: o?.createdAt
        //   ? new Date(o.createdAt).toLocaleDateString('en-IN')
        //   : '—',
        date: o?.createdAt
          ? new Date(o.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—',
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
        { label: 'Services', value: `${servicePct}%` },
        { label: 'Direct Sales', value: `${sellPct}%` },
      ],
      transactions,
    };
  }, [orders, products, selectedDate]);

  const { stats, revenueDistribution, transactions } = computed;
  const salesTrend = useMemo(() => {
    const map = {};

    orders.forEach((o) => {
      const date = new Date(o.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`; // sortable key

      const duration = Number(o?.rentalDuration) || 0;

      const total = (o.products || []).reduce((s, p) => {
        return s + (p.pricePerDay || 0) * (p.quantity || 0) * duration;
      }, 0);

      if (!map[key]) {
        map[key] = {
          month: date.toLocaleString('default', { month: 'short' }),
          revenue: 0,
          sortDate: new Date(date.getFullYear(), date.getMonth(), 1),
        };
      }

      map[key].revenue += total;
    });

    return Object.values(map)
      .sort((a, b) => a.sortDate - b.sortDate) // chronological
      .map(({ month, revenue }) => ({ month, revenue }));
  }, [orders]);
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
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Comprehensive financial overview and performance metrics
                </p>
              </div>

              {/* <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                />

                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white"
                >
                  Download PDF Report
                </button>
              
              </div> */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                  <img
                    src={DateIcon.src}
                    alt="date"
                    className="w-4 h-4 shrink-0"
                  />

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm outline-none bg-transparent [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>

                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white"
                >
                  <img
                    src={downLoad.src}
                    alt="download"
                    className="w-4 h-4 shrink-0"
                  />
                  Download PDF Report
                </button>
              </div>
            </div>
            {/* Top stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
                  <img
                    src={grossRev.src}
                    alt="Gross Revenue"
                    className="w-10 h-10 shrink-0"
                  />
                  GROSS REVENUE
                </p>

                <p className="text-2xl font-semibold text-[#2563EB]">
                  ₹{stats.grossRevenue.toLocaleString('en-IN')}
                </p>

                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : 'Total sales before deductions'}
                </p>
              </div>
              {/* <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">
                  PLATFORM COMMISSION
                </p>
                <p className="text-2xl font-semibold text-orange-500">
                  ₹{stats.platformCommission.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : "Fees paid to Rent'n Pay"}
                </p>
              </div> */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
                  <img
                    src={platformComm.src}
                    alt="Platform Commission"
                    className="w-10 h-10 shrink-0"
                  />
                  PLATFORM COMMISSION
                </p>

                <p className="text-2xl font-semibold text-[#F97316]">
                  ₹{stats.platformCommission.toLocaleString('en-IN')}
                </p>

                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : "Fees paid to Rent'n Pay"}
                </p>
              </div>
              {/* <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">
                  OTHER DEDUCTIONS
                </p>
                <p className="text-2xl font-semibold text-red-500">
                  ₹{stats.otherDeductions.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : 'Loan EMIs & refund adjustments'}
                </p>
              </div> */}
              {/* 
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">NET PAYOUT</p>
                <p className="text-2xl font-semibold text-emerald-600">
                  ₹{stats.netPayout.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : 'Final income received'}
                </p>
              </div> */}
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
                  <img
                    src={netPayout.src}
                    alt="Net Payout"
                    className="w-10 h-10 shrink-0"
                  />
                  NET PAYOUT
                </p>

                <p className="text-2xl font-semibold text-[#10B981]">
                  ₹{stats.netPayout.toLocaleString('en-IN')}
                </p>

                <p className="text-[11px] text-gray-500">
                  {loading ? 'Loading...' : 'Final income received'}
                </p>
              </div>
            </div>

            {/* Middle charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Sales Trend */}
              {/* <div className="bg-white rounded-2xl border border-gray-200 p-5 xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Sales Trend
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Monthly revenue growth over the last 6 months
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-52 md:h-60">
                  <div className="w-full h-full rounded-xl bg-gradient-to-b from-indigo-50 to-white border border-dashed border-indigo-100 flex items-center justify-center">
                    <p className="text-xs text-gray-500">
                      Line chart placeholder – plug real chart library later
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Sales Trend */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 xl:col-span-2">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Sales Trend
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Monthly revenue growth over the last 6 months
                  </p>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tickFormatter={(v) => `₹${v / 1000}k`}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        formatter={(v) => [
                          `₹${v.toLocaleString('en-IN')}`,
                          'Revenue',
                        ]}
                      />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#7C3AED"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Distribution */}
              {/* <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
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
              </div> */}
              {/* Revenue Distribution */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Revenue Distribution
                </p>
                <p className="text-[11px] text-gray-500 mb-4">
                  Income sources breakdown
                </p>

                {/* Donut */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-40 h-40 rounded-full bg-gradient-to-r from-violet-500 via-violet-500 to-violet-500">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          'conic-gradient(#7C3AED 0% 55%, #F97316 55% 80%, #2563EB 80% 100%)',
                      }}
                    />
                    <div className="absolute inset-6 rounded-full bg-white" />
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2 text-xs">
                  {revenueDistribution.map((item, index) => {
                    const colors = [
                      'bg-violet-500',
                      'bg-orange-500',
                      'bg-blue-600',
                    ];

                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${colors[index]}`}
                          />
                          <span>{item.label}</span>
                        </div>

                        <span className="font-medium text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detailed Transaction Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    Detailed Transaction Summary
                  </p>
                  <p className="text-sm text-gray-500">
                    Recent payouts and settlement history
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                {/* <table className="min-w-full text-xs md:text-sm">
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
                        <td
                          colSpan={5}
                          className="py-4 text-center text-gray-500"
                        >
                          No transactions yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table> */}
                <table className="min-w-full text-xs md:text-sm">
                  <thead>
                    <tr className="text-[#64748B] border-b border-gray-100">
                      <th className="py-3 text-left font-medium">DATE</th>
                      <th className="py-3 text-left font-medium">ORDER ID</th>
                      <th className="py-3 text-left font-medium">
                        GROSS AMOUNT
                      </th>
                      <th className="py-3 text-left font-medium">
                        COMMISSION (%)
                      </th>
                      <th className="py-3 text-left font-medium">
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
                        {/* <td className="py-2.5 text-gray-600">{tx.date}</td> */}
                        <td className="py-2.5 text-gray-600">
                          <div className="flex items-center gap-2">
                            <img
                              src={DateIcon.src}
                              alt="date"
                              className="w-3 h-3 shrink-0"
                            />
                            {tx.date}
                          </div>
                        </td>
                        <td className="py-2.5 text-[#0F172A] font-medium">
                          {tx.id}
                        </td>
                        <td className="py-2.5 text-left text-[#2563EB]">
                          {tx.gross}
                        </td>
                        <td className="py-2.5 text-left text-[#F97316]">
                          {tx.commission}
                        </td>
                        <td className="py-2.5 text-left text-emerald-600 font-medium">
                          {tx.settled}
                        </td>
                      </tr>
                    ))}
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
