// 'use client';

// import React, { useState } from 'react';
// // import Sidebar from '../components/Sidebar';
// // import TopBar from '../components/TopBar';

// const Dashboard = () => {
//   // Static data for the dashboard
//   const [stats] = useState({
//     revenue: 125000,
//     vendorsActive: 24,
//     vendorsPending: 5,
//     listingsRent: 30,
//     listingsBuy: 12,
//     listingsService: 8,
//     delayedOrders: 2,
//   });

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Sidebar */}
//       {/* <Sidebar /> */}
//       {/* Main content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* TopBar */}
//         {/* <TopBar /> */}

//         {/* Dashboard content */}
//         <main className="p-6 overflow-auto">
//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
//             {/* Revenue */}
//             <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between">
//               <p className="text-xs font-medium text-gray-500 tracking-wide">
//                 TOTAL REVENUE (COMMISSION)
//               </p>
//               <p className="mt-2 text-2xl font-semibold text-gray-900">
//                 ₹ {stats.revenue.toLocaleString('en-IN')}
//               </p>
//               <p className="mt-1 text-xs text-gray-400">
//                 Net earnings after vendor payouts
//               </p>
//             </div>

//             {/* Vendors */}
//             <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between">
//               <p className="text-xs font-medium text-gray-500 tracking-wide">
//                 VENDOR STATUS
//               </p>
//               <p className="mt-2 text-3xl font-semibold text-emerald-600">
//                 {stats.vendorsActive} Active
//               </p>
//               <p className="mt-1 text-xs text-gray-400">
//                 {stats.vendorsPending} Pending Approval
//               </p>
//             </div>

//             {/* Listings */}
//             <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between">
//               <p className="text-xs font-medium text-gray-500 tracking-wide">
//                 LIVE LISTINGS
//               </p>
//               <p className="mt-2 text-3xl font-semibold text-gray-900">
//                 {stats.listingsRent + stats.listingsBuy + stats.listingsService}
//               </p>
//               <div className="mt-3 space-y-1.5 text-xs">
//                 <div className="flex items-center justify-between">
//                   <span className="text-gray-500">Rent</span>
//                   <span className="font-medium text-gray-700">
//                     {stats.listingsRent}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-gray-500">Buy</span>
//                   <span className="font-medium text-gray-700">
//                     {stats.listingsBuy}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-gray-500">Services</span>
//                   <span className="font-medium text-gray-700">
//                     {stats.listingsService}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Delayed Orders */}
//             <div className="bg-white rounded-2xl border border-rose-200 p-5 flex flex-col justify-between">
//               <p className="text-xs font-medium text-gray-500 tracking-wide">
//                 ORDERS DELAYED &gt; 24 HRS
//               </p>
//               <p className="mt-2 text-4xl font-semibold text-rose-600">
//                 {stats.delayedOrders}
//               </p>
//             </div>
//           </div>

//           {/* Additional sections */}
//           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//             {/* Map / Live Orders */}
//             <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 flex flex-col min-h-[260px] items-center justify-center">
//               <p className="text-gray-500 text-sm">
//                 Map Placeholder – Integrate Map Here
//               </p>
//             </div>

//             {/* Live Feed */}
//             <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
//               <h2 className="text-sm font-semibold text-gray-800 mb-4">
//                 Live Feed
//               </h2>
//               <ul className="space-y-3 text-xs text-gray-600">
//                 <li>New Order #1029 placed by Rahul S.</li>
//                 <li>Vendor &apos;Sai Electronics&apos; uploaded GST documents</li>
//                 <li>Payout Batch #FEB-02 processed successfully</li>
//                 <li>Critical: Order #1015 delivery delayed beyond 24hrs</li>
//               </ul>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  apiGetAllAdminProducts,
  apiGetAllOrders,
  apiGetAllUsers,
  apiGetAllVendors,
} from '@/service/api';
import { buildActivityFeed, formatRelativeTime } from '@/Admin/utils/activityFeed';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    revenue: 0,
    vendorsActive: 0,
    vendorsPending: 0,
    listingsRent: 0,
    listingsBuy: 0,
    listingsService: 0,
    delayedOrders: 0,
  });
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }

    Promise.all([
      apiGetAllUsers(token).then((r) => r.data.users || []),
      apiGetAllVendors(token).then((r) => r.data.vendors || []),
      apiGetAllAdminProducts(token, 'limit=300').then((r) => r.data.products || []),
      apiGetAllOrders(token).then((r) => r.data || []),
    ])
      .then(([users, vendors, products, orders]) => {
        if (!mounted) return;

        const listingsRent = products.filter((p) => p.type === 'Rental').length;
        const listingsBuy = products.filter((p) => p.type === 'Sell').length;
        const listingsService = products.filter(
          (p) =>
            String(p.category || '').toLowerCase().includes('service') ||
            String(p.subCategory || '').toLowerCase().includes('service'),
        ).length;

        const grossOrderValue = orders.reduce((sum, o) => {
          const oneOrder = (o.products || []).reduce(
            (s, i) =>
              s +
              Number(i.pricePerDay || 0) *
                Number(i.quantity || 0) *
                Number(o.rentalDuration || 0),
            0,
          );
          return sum + oneOrder;
        }, 0);

        // For dashboard demo, commission is 10% of gross order value.
        const revenue = Math.round(grossOrderValue * 0.1);

        const delayedOrders = orders.filter((o) => {
          const isOpen = !['delivered', 'cancelled'].includes(String(o.status));
          if (!isOpen) return false;
          const ageMs = Date.now() - new Date(o.createdAt || 0).getTime();
          return ageMs > 24 * 60 * 60 * 1000;
        }).length;

        const latestFeed = buildActivityFeed({ users, vendors, products, orders });
        setFeed(latestFeed);
        sessionStorage.setItem('admin_last_seen_notif_ts', String(Date.now()));

        setStats({
          revenue,
          vendorsActive: vendors.filter((v) => v.isVerified).length,
          vendorsPending: vendors.filter((v) => !v.isVerified).length,
          listingsRent,
          listingsBuy,
          listingsService,
          delayedOrders,
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totalListings = useMemo(
    () => stats.listingsRent + stats.listingsBuy + stats.listingsService,
    [stats.listingsRent, stats.listingsBuy, stats.listingsService],
  );

  return (
    <main className="p-4 sm:p-6 overflow-auto bg-[#f2f4f8] min-h-full">
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-5 mb-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[11px] font-medium text-gray-500 tracking-wide">
                TOTAL REVENUE (COMMISSION)
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                ₹{stats.revenue.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Net earnings after vendor payouts
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[11px] font-medium text-gray-500 tracking-wide">
                VENDOR STATUS
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">
                {stats.vendorsActive} Active
              </p>
              <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 inline-block">
                {stats.vendorsPending} Pending Approval
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[11px] font-medium text-gray-500 tracking-wide">
                LIVE LISTINGS
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {totalListings.toLocaleString('en-IN')}
              </p>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Rent</span>
                  <span className="font-medium">{stats.listingsRent}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Buy (New/Used)</span>
                  <span className="font-medium">{stats.listingsBuy}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Services</span>
                  <span className="font-medium">{stats.listingsService}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-rose-200 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-gray-500 tracking-wide">
                  ORDERS DELAYED {'>'} 24 HRS
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  CRITICAL
                </span>
              </div>
              <p className="mt-3 text-4xl font-semibold text-rose-600">
                {stats.delayedOrders}
              </p>
              <button className="mt-3 px-3 py-2 rounded-lg bg-rose-500 text-white text-xs font-medium">
                View Delayed Orders
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Live Order Activity (Pune)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Geographic distribution &amp; hotspots
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Top: Wakad (45 Orders)
                </span>
              </div>
              <div className="h-[240px] sm:h-[300px] rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-orange-50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,#f97316_0,transparent_20%),radial-gradient(circle_at_65%_40%,#3b82f6_0,transparent_22%),radial-gradient(circle_at_45%_70%,#ef4444_0,transparent_18%)]" />
                <div className="absolute top-8 left-10 w-7 h-7 rounded-full bg-rose-500/80 border-4 border-white shadow" />
                <div className="absolute top-20 left-1/3 w-8 h-8 rounded-full bg-orange-500/80 border-4 border-white shadow" />
                <div className="absolute top-1/2 right-1/4 w-7 h-7 rounded-full bg-blue-500/80 border-4 border-white shadow" />
                <div className="absolute bottom-10 left-1/2 w-9 h-9 rounded-full bg-red-500/80 border-4 border-white shadow" />
                <div className="absolute bottom-3 right-3 text-[11px] text-gray-500 bg-white/90 border rounded-lg px-2 py-1">
                  Dummy map preview
                </div>
              </div>
            </div>

            <div
              id="live-feed"
              className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Live Feed</h2>
                  <p className="text-xs text-gray-500">Recent platform events</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <ul className="space-y-2.5">
                {feed.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                  >
                    <p className="text-sm text-gray-800 font-medium">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.subtitle}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
              <button className="mt-4 w-full text-sm rounded-lg border border-orange-300 text-orange-600 py-2 hover:bg-orange-50">
                View All Activity
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default Dashboard;
