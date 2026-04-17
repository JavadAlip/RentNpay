'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGetCategories } from '../../lib/api';
import { useRouter } from 'next/navigation';

const RentalCategories = () => {
  const sliderRef = useRef(null);
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

  const scrollLeft = () =>
    sliderRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  const scrollRight = () =>
    sliderRef.current?.scrollBy({ left: 300, behavior: 'smooth' });

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

        {/* Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {loading ? (
              // Skeleton loaders
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-[180px] sm:w-[210px] md:w-[220px] lg:w-[240px] text-center animate-pulse"
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
                  className="flex-none w-[180px] sm:w-[210px] md:w-[220px] lg:w-[240px] text-center cursor-pointer group"
                >
                  <div className="bg-white border rounded-xl h-[170px] sm:h-[190px] md:h-[200px] p-4 sm:p-5 hover:shadow-md hover:border-orange-300 transition-all flex items-center justify-center">
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

          {/* Arrows */}
          {!loading && categories.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={scrollLeft}
                className="p-2 border border-gray-300 text-gray-700 rounded-full hover:bg-black hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={scrollRight}
                className="p-2 border border-gray-300 text-gray-700 rounded-full hover:bg-black hover:text-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RentalCategories;
