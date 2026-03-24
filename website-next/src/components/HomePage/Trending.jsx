'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { apiGetAllProducts, apiGetPublicActiveOffers } from '@/lib/api';

import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  Truck,
  MapPin,
} from 'lucide-react';

const Trending = () => {
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState('All');
  const [products, setProducts] = useState([]);
  const [offersByProduct, setOffersByProduct] = useState({});
  const [loading, setLoading] = useState(true);

  const parsePrice = (raw) => {
    const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([apiGetAllProducts('limit=200'), apiGetPublicActiveOffers()])
      .then(([pRes, oRes]) => {
        if (!mounted) return;
        const allProducts = pRes.data?.products || [];
        const rentProducts = allProducts.filter((p) => p.type === 'Rental');
        setProducts(rentProducts);

        const map = {};
        (oRes.data?.offers || []).forEach((o) => {
          map[String(o.productId)] = o;
        });
        setOffersByProduct(map);
      })
      .catch(() => {
        if (!mounted) return;
        setProducts([]);
        setOffersByProduct({});
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cardsPerPage = 6;

  const filteredProducts =
    activeTab === 'All'
      ? products
      : activeTab === 'Rent'
        ? products
        : activeTab === 'Sale'
          ? products.filter((p) => p.type === 'Sell')
          : products.filter((p) =>
              String(p.category || '')
                .toLowerCase()
                .includes('service'),
            );

  const visibleProducts = filteredProducts.slice(
    page * cardsPerPage,
    page * cardsPerPage + cardsPerPage,
  );

  const nextSlide = () => {
    if ((page + 1) * cardsPerPage < filteredProducts.length) {
      setPage(page + 1);
    }
  };

  const prevSlide = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
            Trending Near You !
          </h2>
        </div>

        {/* DESCRIPTION */}
        <p className="text-gray-500 mb-6 text-sm sm:text-base">
          Explore the most popular rentals, verified used electronics, and
          top-rated services in your neighborhood
        </p>

        {/* CATEGORY + FILTERS */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          {/* TABS */}
          <div className="flex gap-6 text-sm">
            {['All', 'Rent', 'Sale', 'Services'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(0);
                }}
                className={`pb-1 ${
                  activeTab === tab
                    ? 'border-b-2 border-black font-medium'
                    : 'text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <button className="border px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
              Available Today
            </button>

            <button className="border px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
              Under ₹500
            </button>

            <button className="border px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
              Top Rated
            </button>
          </div>
        </div>

        {/* PRODUCT GRID */}
        {loading ? (
          <div className="flex justify-center py-14">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProducts.map((item) => {
              const offer = offersByProduct[String(item._id)];
              const base = parsePrice(item.price);
              const discount = Number(offer?.discountPercent || 0);
              const finalPrice = Math.max(
                0,
                Math.round(base - (base * discount) / 100),
              );
              const hasOffer = !!offer && discount > 0;
              const tag = offer?.sticker || 'Bestseller';
              const statusType = item.stock > 0 ? 'delivery' : 'pickup';
              const status = item.stock > 0 ? '2-4 days' : 'Self-Pickup';
              const rating = (
                4 +
                ((item.productName?.length || 3) % 10) / 10
              ).toFixed(1);

              return (
                <div
                  key={item._id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition"
                >
                  {/* IMAGE SECTION */}
                  <div className="relative p-3 sm:p-4">
                    <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {tag}
                    </span>

                    <button className="absolute top-4 right-4 bg-white p-1 rounded-full shadow">
                      <Heart size={16} />
                    </button>

                    <img
                      src={item.image || mainimg}
                      alt="product"
                      className="w-full h-40 sm:h-44 object-contain"
                    />
                  </div>

                  {/* CARD CONTENT */}
                  <div className="px-3 sm:px-4 pb-4">
                    {/* STATUS BADGE */}
                    <div className="mb-2 flex items-center justify-between">
                      {statusType === 'delivery' ? (
                        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full w-fit">
                          <Truck size={12} />
                          {status}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full w-fit">
                          <MapPin size={12} />
                          {status}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500">
                        {item.type === 'Rental' ? 'For Rent' : 'Brand New'}
                      </span>
                    </div>

                    {/* TITLE + RATING */}
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-medium">
                        {item.productName}
                      </h3>

                      <div className="flex items-center gap-1 text-white text-[11px] bg-emerald-500 px-2 py-0.5 rounded-full">
                        <Star size={12} fill="white" />
                        {rating}
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="flex items-end justify-between gap-2 mb-3">
                      <div>
                        <span className="font-semibold text-2xl leading-none">
                          ₹{hasOffer ? finalPrice : base}
                        </span>
                        <span className="ml-1 text-sm font-medium text-gray-800">/mo</span>
                        {hasOffer ? (
                          <span className="ml-2 text-gray-400 text-xs line-through">
                            ₹{base}
                          </span>
                        ) : null}
                      </div>

                      {hasOffer ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full border text-[11px] font-medium text-[#F97316] border-[#F97316] bg-orange-50 whitespace-nowrap">
                          {discount}% Off
                        </span>
                      ) : null}
                    </div>

                    {/* BUTTON */}
                    <Link
                      href={`/rent-product-details/${item._id}`}
                      className="block w-full text-center bg-[#F97316] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ARROWS */}
        <div className="flex justify-center gap-4 mt-10">
          <button
            onClick={prevSlide}
            className="p-3 border rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={nextSlide}
            className="p-3 bg-black text-white rounded-full"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Trending;
