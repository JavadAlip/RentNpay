'use client';

import React, { useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';

const NavbarSecondary = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="bg-[#f5f5f5] border-b">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative w-full min-w-0 max-w-2xl">
          <Search
            size={18}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder='Try Searching "Samsung Washing Machine"'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm sm:text-base"
          />
        </div>

        {/* Location */}
        <button className="flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm whitespace-nowrap shrink-0 py-2 sm:py-0">
          <MapPin size={16} className="text-orange-500 shrink-0" />
          <span className="text-gray-600 hidden sm:inline">Deliver to</span>
          <span className="text-orange-500 font-medium truncate max-w-[140px] sm:max-w-none">
            Sadashiv Peth, Pune
          </span>
          <ChevronDown size={16} className="text-gray-500 shrink-0" />
        </button>
      </div>
    </div>
  );
};

export default NavbarSecondary;
