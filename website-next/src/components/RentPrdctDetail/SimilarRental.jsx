'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { apiGetStorefrontVendorProducts } from '@/lib/api';
import {
  getRentalListingAmount,
  getRentalListingSuffix,
  getProductDeliveryEtaLabel,
} from '@/lib/rentalPriceDisplay';
import { useRouter } from 'next/navigation';

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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    apiGetStorefrontVendorProducts('limit=200')
      .then((res) => {
        if (!mounted) return;
        const allProducts = res.data?.products || [];
        const rentProducts = allProducts.filter((p) => p.type === 'Rental');
        setProducts(rentProducts);
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

  const cardsPerPage = 3;

  const filteredProducts = useMemo(() => products, [products]);

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
          <button
            onClick={() => router.push('/products')}
            className="text-orange-500 text-xs sm:text-sm font-medium w-fit whitespace-nowrap"
          >
            View All →
          </button>
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            Array.from({ length: cardsPerPage }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="bg-white border rounded-lg sm:rounded-xl overflow-hidden min-w-0 animate-pulse"
              >
                <div className="h-44 bg-gray-100" />
                <div className="px-3 sm:px-4 py-4">
                  <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded mb-4" />
                  <div className="h-9 w-full bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))
          ) : visibleProducts.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-full py-8 text-center">
              No similar rentals found.
            </p>
          ) : (
            visibleProducts.map((item) => {
              const base = getRentalListingAmount(item);
              const priceSuffix = getRentalListingSuffix(item) || '/mo';
              const old = Math.round(base * 1.2);
              const inStock = Number(item?.stock || 0) > 0;
              const rating = (
                4 +
                ((item?.productName?.length || 3) % 10) / 10
              ).toFixed(1);

              return (
                <div
                  key={item?._id}
                  className="bg-white border rounded-lg sm:rounded-xl overflow-hidden hover:shadow-md transition min-w-0"
                >
                  {/* IMAGE SECTION */}
                  <div className="relative p-3 sm:p-4">
                    <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                      Bestseller
                    </span>
                    <button className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white p-1 rounded-full shadow">
                      <Heart size={14} />
                    </button>
                    <img
                      src={item?.image || mainimg}
                      alt={item?.productName || 'product'}
                      className="w-full h-32 sm:h-40 object-contain"
                    />
                  </div>

                  {/* CARD CONTENT */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="mb-1.5 sm:mb-2">
                      {inStock ? (
                        <span className="flex items-center gap-1 text-[10px] sm:text-xs bg-blue-100 text-blue-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full w-fit">
                          <Truck size={10} />
                          {getProductDeliveryEtaLabel(item) || 'Varies'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] sm:text-xs bg-purple-100 text-purple-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full w-fit">
                          <MapPin size={10} />
                          Self-Pickup
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center gap-2 mb-1">
                      <h3 className="text-xs sm:text-sm font-medium min-w-0 truncate">
                        {item?.productName || 'Rental Product'}
                      </h3>
                      <div className="flex items-center gap-0.5 sm:gap-1 text-green-600 text-[10px] sm:text-xs shrink-0">
                        <Star size={12} className="text-green-600" fill="currentColor" />
                        {rating}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <span className="font-semibold text-sm sm:text-base">
                        ₹{base}
                        {priceSuffix}
                      </span>
                      <span className="text-gray-400 text-[10px] sm:text-xs line-through">
                        ₹{old}
                      </span>
                    </div>

                    {inStock ? (
                      <button
                        onClick={() => router.push(`/rent-product-details/${item?._id}`)}
                        className="w-full bg-orange-500 text-white py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-orange-600"
                      >
                        Rent Now
                      </button>
                    ) : (
                      <button className="w-full border border-gray-300 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-100">
                        Get Notified
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
