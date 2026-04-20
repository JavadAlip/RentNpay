'use client';

import React, { useEffect, useState } from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { apiGetCategories } from '../../lib/api';
import { useRouter } from 'next/navigation';

const RentalCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiGetCategories()
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.categories || [];
        setCategories(list.filter((c) => c.availableInRent));
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
              Rental Categories
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-lg">
              Explore the most popular rentals, verified used electronics, and
              top-rated services in your neighborhood
            </p>
          </div>
          <button
            onClick={() => router.push('/products?type=Rental')}
            className="bg-black text-white px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm w-fit whitespace-nowrap"
          >
            View All Categories
          </button>
        </div>

        {/* Categories Grid */}
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
            {loading ? (
              // Skeleton loaders
              Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="text-center animate-pulse"
                >
                  <div className="bg-gray-200 rounded-xl h-[170px] sm:h-[190px] md:h-[200px] w-full" />
                  <div className="mt-3 h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                </div>
              ))
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500 py-8">No categories found.</p>
            ) : (
              categories.map((item, index) => (
                <div
                  key={item._id || index}
                  onClick={() =>
                    router.push(
                      `/products?type=Rental&category=${encodeURIComponent(item.name || '')}`,
                    )
                  }
                  className="text-center cursor-pointer group"
                >
                  <div className="bg-white border-2 border-gray-300 rounded-xl h-[170px] sm:h-[190px] md:h-[200px] p-4 sm:p-5 hover:shadow-md hover:border-orange-300 transition-all flex items-center justify-center">
                    <img
                      src={item.image || mainimg}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = mainimg;
                      }}
                    />
                  </div>
                  <p className="mt-3 text-gray-800 font-medium text-sm group-hover:text-orange-500 transition-colors">
                    {item.name}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default RentalCategories;
