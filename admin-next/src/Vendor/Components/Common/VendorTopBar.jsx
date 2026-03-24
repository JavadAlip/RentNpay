'use client';

import React from 'react';
import { useSelector } from 'react-redux';

const VendorTopBar = () => {
  const { user } = useSelector((state) => state.vendor);

  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex flex-col">
        <h1 className="text-base md:text-lg font-semibold text-gray-900">
          Dashboard
        </h1>
        {/* <p className="text-[11px] md:text-xs text-gray-500">
          February 2026 · Comprehensive financial overview and performance
          metrics
        </p> */}
      </div>

      <div className="flex items-center gap-3">
        {/* <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Mumbai</span>
        </button> */}

        {/* <button className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
          IN
        </button> */}

        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50">
            <span className="sr-only">Notifications</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">
                {user?.fullName || 'User Name'}
              </p>
              <p className="text-[11px] text-gray-400">Vendor</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-semibold">
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default VendorTopBar;
