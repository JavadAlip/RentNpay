'use client';

import React, { useState } from 'react';
// import Sidebar from '../components/Sidebar';
// import TopBar from '../components/TopBar';

const Dashboard = () => {
  // Static data for the dashboard
  const [stats] = useState({
    revenue: 125000,
    vendorsActive: 24,
    vendorsPending: 5,
    listingsRent: 30,
    listingsBuy: 12,
    listingsService: 8,
    delayedOrders: 2,
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {/* <Sidebar /> */}
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        {/* <TopBar /> */}

        {/* Dashboard content */}
        <main className="p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
            {/* Revenue */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between">
              <p className="text-xs font-medium text-gray-500 tracking-wide">
                TOTAL REVENUE (COMMISSION)
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                ₹ {stats.revenue.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Net earnings after vendor payouts
              </p>
            </div>

            {/* Vendors */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between">
              <p className="text-xs font-medium text-gray-500 tracking-wide">
                VENDOR STATUS
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">
                {stats.vendorsActive} Active
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {stats.vendorsPending} Pending Approval
              </p>
            </div>

            {/* Listings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between">
              <p className="text-xs font-medium text-gray-500 tracking-wide">
                LIVE LISTINGS
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {stats.listingsRent + stats.listingsBuy + stats.listingsService}
              </p>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Rent</span>
                  <span className="font-medium text-gray-700">
                    {stats.listingsRent}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Buy</span>
                  <span className="font-medium text-gray-700">
                    {stats.listingsBuy}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Services</span>
                  <span className="font-medium text-gray-700">
                    {stats.listingsService}
                  </span>
                </div>
              </div>
            </div>

            {/* Delayed Orders */}
            <div className="bg-white rounded-2xl border border-rose-200 p-5 flex flex-col justify-between">
              <p className="text-xs font-medium text-gray-500 tracking-wide">
                ORDERS DELAYED &gt; 24 HRS
              </p>
              <p className="mt-2 text-4xl font-semibold text-rose-600">
                {stats.delayedOrders}
              </p>
            </div>
          </div>

          {/* Additional sections */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Map / Live Orders */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 flex flex-col min-h-[260px] items-center justify-center">
              <p className="text-gray-500 text-sm">
                Map Placeholder – Integrate Map Here
              </p>
            </div>

            {/* Live Feed */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Live Feed
              </h2>
              <ul className="space-y-3 text-xs text-gray-600">
                <li>New Order #1029 placed by Rahul S.</li>
                <li>Vendor &apos;Sai Electronics&apos; uploaded GST documents</li>
                <li>Payout Batch #FEB-02 processed successfully</li>
                <li>Critical: Order #1015 delivery delayed beyond 24hrs</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
