'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiGetCategories } from '@/lib/api';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { useRouter } from 'next/navigation';

const fallbackImageByIndex = (i) =>
  `https://images.unsplash.com/photo-${[
    '1555041469-a586c61ea9bc',
    '1505693416388-ac5ce068fe85',
    '1493666438817-866a91353ca9',
    '1581578731548-c64695cc6952',
    '1571902943202-507ec2618e8f',
    '1542291026-7eec264c27ff',
  ][i % 6]}?auto=format&fit=crop&w=500&q=80`;

const BuyCategories = () => {
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    apiGetCategories()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.categories)
            ? res.data.categories
            : [];
        setCategories(list.filter((c) => c.availableInBuy));
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = useMemo(() => categories, [categories]);

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Buying Categories
            </h2>
            <p className="text-gray-600 text-sm mt-2 max-w-lg">
              Explore the most popular rentals, verified used electronics, and
              top-rated services in your neighborhood
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/products?type=Sell')}
            className="bg-black text-white px-5 py-2 rounded-full text-sm w-fit"
          >
            View All Categories
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {visibleItems.map((item, index) => (
            <div
              key={item._id || item.slug || index}
              className="text-center cursor-pointer group"
              onClick={() =>
                router.push(
                  `/products?type=Sell&category=${encodeURIComponent(item.name || '')}`,
                )
              }
            >
              <div className="bg-white border-2 border-gray-300 rounded-xl h-[170px] sm:h-[190px] md:h-[200px] p-4 sm:p-5 hover:shadow-md hover:border-orange-300 transition-all flex items-center justify-center">
                <img
                  src={item.image || fallbackImageByIndex(index) || mainimg}
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
          ))}
          {visibleItems.length === 0 ? (
            <p className="col-span-full text-center text-sm text-gray-500 py-8">
              Categories not available right now.
            </p>
          ) : null}
        </div>

      </div>
    </section>
  );
};

export default BuyCategories;
