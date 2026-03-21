'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IMG_HOME_SCREENS as mainimg } from '@/lib/assetPlaceholders';

const banners = [mainimg, mainimg, mainimg];

const SaleBanner = () => {
  const [index, setIndex] = useState(0);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <section className="w-full py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto relative">
        {/* Banner Image */}
        <div className="overflow-hidden rounded-xl">
          <img
            src={banners[index]}
            alt="banner"
            className="w-full h-[220px] sm:h-[280px] md:h-[320px] lg:h-[360px] object-cover transition-all duration-500"
          />
        </div>

        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          className="absolute top-1/2 left-2 md:left-4 -translate-y-1/2 bg-white shadow-md p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className="absolute top-1/2 right-2 md:right-4 -translate-y-1/2 bg-white shadow-md p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
};

export default SaleBanner;
