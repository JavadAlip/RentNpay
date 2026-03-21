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

const SimilarRental = () => {
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
  ];

  const cardsPerPage = 3;

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
    <section className="w-full py-10 sm:py-16 px-3 sm:px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-3">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
            Similar Rentals You May Like
          </h2>
          <button className="text-orange-500 text-xs sm:text-sm font-medium w-fit whitespace-nowrap">
            View All →
          </button>
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {visibleProducts.map((item, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg sm:rounded-xl overflow-hidden hover:shadow-md transition min-w-0"
            >
              {/* IMAGE SECTION */}
              <div className="relative p-3 sm:p-4">
                <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                  {item.tag}
                </span>
                <button className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white p-1 rounded-full shadow">
                  <Heart size={14} />
                </button>
                <img
                  src={mainimg}
                  alt="product"
                  className="w-full h-32 sm:h-40 object-contain"
                />
              </div>

              {/* CARD CONTENT */}
              <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="mb-1.5 sm:mb-2">
                  {item.statusType === 'delivery' ? (
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs bg-blue-100 text-blue-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full w-fit">
                      <Truck size={10} />
                      {item.status}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs bg-purple-100 text-purple-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full w-fit">
                      <MapPin size={10} />
                      {item.status}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2 mb-1">
                  <h3 className="text-xs sm:text-sm font-medium min-w-0 truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-green-600 text-[10px] sm:text-xs shrink-0">
                    <Star size={12} className="text-green-600" fill="currentColor" />
                    {item.rating}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="font-semibold text-sm sm:text-base">{item.price}</span>
                  <span className="text-gray-400 text-[10px] sm:text-xs line-through">
                    {item.oldPrice}
                  </span>
                </div>

                {item.btn === 'Get Notified' ? (
                  <button className="w-full border border-gray-300 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-100">
                    Get Notified
                  </button>
                ) : (
                  <button className="w-full bg-orange-500 text-white py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-orange-600">
                    Rent Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ARROWS */}
        <div className="flex justify-center gap-3 sm:gap-4 mt-6 sm:mt-10">
          <button
            onClick={prevSlide}
            className="p-2 sm:p-3 border rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 sm:p-3 bg-black text-white rounded-full"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SimilarRental;
