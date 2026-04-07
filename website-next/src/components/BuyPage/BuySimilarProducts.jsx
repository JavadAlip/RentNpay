'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { apiGetStorefrontVendorProducts } from '@/lib/api';
import { getRentalListingAmount } from '@/lib/rentalPriceDisplay';

const CARDS_PER_PAGE = 3;

export default function BuySimilarProducts() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiGetStorefrontVendorProducts('limit=200')
      .then((res) => {
        if (!mounted) return;
        const all = Array.isArray(res?.data?.products) ? res.data.products : [];
        setProducts(all.filter((p) => String(p?.type) === 'Sell'));
      })
      .catch(() => {
        if (!mounted) return;
        setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const visible = useMemo(
    () => products.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE),
    [products, page],
  );

  const next = () => {
    if ((page + 1) * CARDS_PER_PAGE < products.length) setPage((p) => p + 1);
  };
  const prev = () => {
    if (page > 0) setPage((p) => p - 1);
  };

  return (
    <section className="w-full py-10 sm:py-14 px-3 sm:px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Similar products You May Like</h2>
          <Link href="/products" className="text-sm text-orange-500 font-medium">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading
            ? Array.from({ length: CARDS_PER_PAGE }).map((_, i) => (
                <div key={i} className="bg-white border rounded-2xl p-4 animate-pulse h-72" />
              ))
            : visible.map((item) => {
                const price = getRentalListingAmount(item);
                const old = Math.round(price * 1.25);
                return (
                  <div
                    key={item._id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition"
                  >
                    <div className="relative p-3">
                      <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        Bestseller
                      </span>
                      <button className="absolute top-3 right-3 bg-white p-1 rounded-full shadow">
                        <Heart size={14} />
                      </button>
                      <img
                        src={item?.image || 'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=700&q=80'}
                        alt={item?.productName}
                        className="w-full h-44 object-cover rounded-xl"
                      />
                    </div>
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{item?.productName}</h3>
                        <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[11px] px-2 py-0.5 rounded-full">
                          <Star size={11} fill="white" />
                          4.3
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{item?.condition || 'Brand New'}</p>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <span className="text-2xl font-semibold">₹{price}</span>
                          <span className="text-xs text-gray-400 line-through ml-2">₹{old}</span>
                        </div>
                        <span className="text-[11px] text-orange-500 border border-orange-200 rounded-full px-2 py-0.5">
                          20% Off
                        </span>
                      </div>
                      <Link
                        href={`/rent-product-details/${item?._id}`}
                        className="block w-full text-center bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium"
                      >
                        Buy Now
                      </Link>
                    </div>
                  </div>
                );
              })}
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <button onClick={prev} className="p-2 border rounded-full hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="p-2 bg-black text-white rounded-full">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
