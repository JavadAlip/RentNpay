'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGetCategories } from '@/lib/api';
import { useRouter } from 'next/navigation';

const FeaturedCategories = () => {
  const sliderRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiGetCategories();
        // Adjust depending on your backend response shape
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.categories || [];
        setCategories(list);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const scrollLeft = () => {
    sliderRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    sliderRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
              Featured Categories
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-lg">
              Explore the most popular rentals, verified used electronics, and
              top-rated services in your neighborhood
            </p>
          </div>

          <button
            onClick={() => router.push('/rent')}
            className="bg-black text-white px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm w-fit whitespace-nowrap"
          >
            View All
          </button>
        </div>

        {/* Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-6"
          >
            {loading ? (
              <div className="text-sm text-gray-500">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-sm text-gray-500">No categories found.</div>
            ) : (
              categories.map((item, index) => (
                <div
                  key={item._id || item.slug || index}
                  className="flex-none w-[180px] sm:w-[210px] md:w-[220px] lg:w-[240px] text-center"
                >
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/rent?category=${encodeURIComponent(item.name || '')}`)
                    }
                    className="w-full bg-white border rounded-xl h-[170px] sm:h-[190px] md:h-[200px] p-4 sm:p-5 hover:shadow-md transition flex items-center justify-center"
                  >
                    <img
                      src={item.image || mainimg}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </button>

                  <p className="mt-3 text-gray-800 font-medium">{item.name}</p>
                </div>
              ))
            )}
          </div>

          {/* Arrows */}
          {!loading && categories.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={scrollLeft}
                className="p-2 border rounded-full hover:bg-gray-100"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={scrollRight}
                className="p-2 bg-black text-white rounded-full"
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

export default FeaturedCategories;
