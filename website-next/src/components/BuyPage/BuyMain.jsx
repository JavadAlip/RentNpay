'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiGetStorefrontVendorProducts } from '@/lib/api';

const buybanner =
  'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1600&q=80';

const BuyBannerSection = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    apiGetStorefrontVendorProducts('limit=250')
      .then((res) => {
        if (!mounted) return;
        const all = Array.isArray(res?.data?.products) ? res.data.products : [];
        setProducts(all.filter((p) => String(p?.type) === 'Sell'));
      })
      .catch(() => {
        if (!mounted) return;
        setProducts([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const all = products.length;
    const brandNew = products.filter(
      (p) => String(p?.condition || '').toLowerCase() === 'brand new',
    ).length;
    const preOwned = Math.max(0, all - brandNew);
    return { all, brandNew, preOwned };
  }, [products]);

  return (
    <section className="w-full bg-white py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Top banner image */}
        <div className="rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm border border-gray-200">
          <img
            src={buybanner}
            alt="Summer sale banner"
            className="w-full h-48 sm:h-56 md:h-72 lg:h-80 xl:h-[320px] object-cover"
          />
        </div>

        {/* Text + buttons under banner */}
        <div className="mt-6 sm:mt-10 text-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
            Your Choice. Your Price.{' '}
            <span className="text-orange-500">Your Rentnpay</span>
          </h2>

          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 px-1">
            Brand New Products with warranty or Certified Pre-owned Details
          </p>

          <div className="mt-4 sm:mt-6 flex flex-row flex-nowrap items-center justify-center gap-1.5 sm:gap-3 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 sm:px-6 md:px-8 py-1.5 sm:py-2.5 rounded-full text-[10px] sm:text-sm font-medium whitespace-nowrap shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-[0_8px_18px_rgba(251,146,60,0.45)]'
                  : 'bg-[#f7f7f7] text-gray-800 border border-gray-200'
              }`}
            >
              All Products ({stats.all})
            </button>
            <button
              onClick={() => setActiveFilter('brandNew')}
              className={`px-2.5 sm:px-6 md:px-8 py-1.5 sm:py-2.5 rounded-full text-[10px] sm:text-sm whitespace-nowrap shrink-0 ${
                activeFilter === 'brandNew'
                  ? 'bg-orange-500 text-white shadow-[0_8px_18px_rgba(251,146,60,0.45)]'
                  : 'bg-[#f7f7f7] text-gray-800 border border-gray-200'
              }`}
            >
              Brand New ({stats.brandNew})
            </button>
            <button
              onClick={() => setActiveFilter('preOwned')}
              className={`px-2.5 sm:px-6 md:px-8 py-1.5 sm:py-2.5 rounded-full text-[10px] sm:text-sm whitespace-nowrap shrink-0 ${
                activeFilter === 'preOwned'
                  ? 'bg-orange-500 text-white shadow-[0_8px_18px_rgba(251,146,60,0.45)]'
                  : 'bg-[#f7f7f7] text-gray-800 border border-gray-200'
              }`}
            >
              Pre-Owned / Refurbished ({stats.preOwned})
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuyBannerSection;
