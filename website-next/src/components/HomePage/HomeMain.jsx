import React from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { useRouter } from 'next/navigation';
import homeMainImg from '@/assets/images/home-main.png';

import { ShoppingBag } from 'lucide-react';

const HomeMain = () => {
  const router = useRouter();
  return (
    <section className="w-full bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-10">
        {/* Left Content */}
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight">
            Buy, Rent, Or Book <br />
            Services — <br />
            All In One Place.
          </h1>

          <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto md:mx-0">
            The hyper-local marketplace for furniture, electronics, and expert
            repairs.{' '}
            <span className="font-semibold text-gray-900">
              Delivered from verified shops near you 🧡
            </span>
          </p>
          <div className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center md:justify-start">
            {/* Buy New */}
            <button
              onClick={() => router.push('/buy')}
              className="flex items-center gap-2 bg-white text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium border border-gray-300 hover:bg-[#E5E5E5] transition whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              Buy New
            </button>

            {/* Contact Us */}
            <button className="bg-white text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium border border-gray-300 hover:bg-[#E5E5E5] transition whitespace-nowrap">
              Contact Us
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div className="flex justify-center">
          <img
            src={homeMainImg.src}
            alt="product"
            className="w-full max-w-md lg:max-w-lg object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default HomeMain;
