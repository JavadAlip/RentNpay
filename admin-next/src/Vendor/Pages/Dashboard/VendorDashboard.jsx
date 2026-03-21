'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { vendorLogout } from '../../../redux/slices/vendorSlice';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';

const VendorDashboardPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.vendor);

  const handleLogout = async () => {
    await dispatch(vendorLogout());
    router.replace('/vendor-main');
  };

  const stats = {
    grossRevenue: 420000,
    platformCommission: 48000,
    otherDeductions: 12000,
    netPayout: 360000,
  };

  const revenueDistribution = [
    { label: 'Rentals', value: '55%' },
    { label: 'Services', value: '25%' },
    { label: 'Direct Sales', value: '20%' },
  ];

  const transactions = [
    {
      date: '15 Feb 2026',
      id: 'ORD-2891',
      gross: '₹45,000',
      commission: '12%',
      settled: '₹39,600',
    },
    {
      date: '14 Feb 2026',
      id: 'ORD-2890',
      gross: '₹32,000',
      commission: '10%',
      settled: '₹28,800',
    },
    {
      date: '13 Feb 2026',
      id: 'ORD-2889',
      gross: '₹58,000',
      commission: '12%',
      settled: '₹51,040',
    },
    {
      date: '12 Feb 2026',
      id: 'ORD-2888',
      gross: '₹28,000',
      commission: '10%',
      settled: '₹25,200',
    },
    {
      date: '11 Feb 2026',
      id: 'ORD-2887',
      gross: '₹65,000',
      commission: '12%',
      settled: '₹57,200',
    },
    {
      date: '10 Feb 2026',
      id: 'ORD-2886',
      gross: '₹42,000',
      commission: '10%',
      settled: '₹37,800',
    },
  ];

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
                  Total sales before deductions
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
                  Fees paid to Rent&apos;n Pay
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
                  Loan EMIs &amp; refund adjustments
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">NET PAYOUT</p>
                <p className="text-2xl font-semibold text-emerald-600">
                  ₹{stats.netPayout.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-500">
                  Final income received
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
