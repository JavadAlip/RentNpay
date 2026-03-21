'use client';

import React, { useState } from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';

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

  const products = [
    {
      title: 'LG 7.5kg Washing Machine',
      price: '₹1499/mo',
      oldPrice: '₹1799',
      rating: '4.3',
      tag: 'Bestseller',
      btn: 'Get Notified',
      type: 'rent',
      status: '2-4 days',
      statusType: 'delivery',
    },
    {
      title: 'Samsung Monitor 14"',
      price: '₹1499/mo',
      oldPrice: '₹1799',
      rating: '4.3',
      tag: 'Bestseller',
      btn: 'Rent Now',
      type: 'rent',
      status: '2-4 days',
      statusType: 'delivery',
    },
    {
      title: 'Activa Scooty',
      price: '₹299/day',
      oldPrice: '₹1799',
      rating: '4.3',
      tag: 'Bestseller',
      btn: 'Rent Now',
      type: 'rent',
      status: 'Self-Pickup',
      statusType: 'pickup',
    },
    {
      title: 'Gaming Chair',
      price: '₹1999',
      oldPrice: '₹2499',
      rating: '4.6',
      tag: 'Bestseller',
      btn: 'Get Notified',
      type: 'sale',
      status: '2-4 days',
      statusType: 'delivery',
    },
    {
      title: 'Laptop Table',
      price: '₹799',
      oldPrice: '₹999',
      rating: '4.2',
      tag: 'Bestseller',
      btn: 'Rent Now',
      type: 'sale',
      status: '2-4 days',
      statusType: 'delivery',
    },
    {
      title: 'Office Chair',
      price: '₹1199',
      oldPrice: '₹1499',
      rating: '4.4',
      tag: 'Bestseller',
      btn: 'Rent Now',
      type: 'sale',
      status: '2-4 days',
      statusType: 'delivery',
    },
    {
      title: 'Refrigerator',
      price: '₹2499',
      oldPrice: '₹2999',
      rating: '4.5',
      tag: 'Bestseller',
      btn: 'Get Notified',
      type: 'services',
      status: 'Self-Pickup',
      statusType: 'pickup',
    },
    {
      title: 'Microwave',
      price: '₹999',
      oldPrice: '₹1299',
      rating: '4.1',
      tag: 'Bestseller',
      btn: 'Rent Now',
      type: 'services',
      status: '2-4 days',
      statusType: 'delivery',
    },
  ];

  const cardsPerPage = 6;

  const filteredProducts =
    activeTab === 'All'
      ? products
      : products.filter((p) => p.type === activeTab.toLowerCase());

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

          <button className="border px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap hover:bg-gray-100">
            View All Deals
          </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((item, index) => (
            <div
              key={index}
              className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition"
            >
              {/* IMAGE SECTION */}
              <div className="relative p-4">
                <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  {item.tag}
                </span>

                <button className="absolute top-4 right-4 bg-white p-1 rounded-full shadow">
                  <Heart size={16} />
                </button>

                <img
                  src={mainimg}
                  alt="product"
                  className="w-full h-40 object-contain"
                />
              </div>

              {/* CARD CONTENT */}
              <div className="px-4 pb-4">
                {/* STATUS BADGE */}
                <div className="mb-2">
                  {item.statusType === 'delivery' ? (
                    <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full w-fit">
                      <Truck size={12} />
                      {item.status}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full w-fit">
                      <MapPin size={12} />
                      {item.status}
                    </span>
                  )}
                </div>

                {/* TITLE + RATING */}
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium">{item.title}</h3>

                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <Star size={14} fill="green" />
                    {item.rating}
                  </div>
                </div>

                {/* PRICE */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold">{item.price}</span>

                  <span className="text-gray-400 text-xs line-through">
                    {item.oldPrice}
                  </span>
                </div>

                {/* BUTTON */}
                {item.btn === 'Get Notified' ? (
                  <button className="w-full border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-100">
                    Get Notified
                  </button>
                ) : (
                  <button className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600">
                    Rent Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

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
