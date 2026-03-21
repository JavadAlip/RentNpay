import React from 'react';
import { IMG_SERVICE_BANNER as serviceBanner } from '@/lib/assetPlaceholders';

const ServiceBannerSection = () => {
  return (
    <section className="w-full bg-white py-8 sm:py-14 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-6 sm:gap-10">
        {/* Left text */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight">
            Expert Services <br />
            Verified Pros <br />
            <span className="text-orange-500">At Doorstep</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-md mx-auto md:mx-0">
            Book trusted local professionals from shops near you. 🧡
          </p>
        </div>

        {/* Right image + pill button */}
        <div className="flex flex-col items-center gap-4 sm:gap-5">
          <img
            src={serviceBanner}
            alt="Service professional"
            className="w-full max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl object-contain md:object-cover rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem]"
          />

          <button className="px-5 sm:px-8 md:px-10 py-2 sm:py-2.5 rounded-full bg-orange-500 text-white text-xs sm:text-sm md:text-base font-medium shadow-[0_10px_22px_rgba(249,115,22,0.45)] whitespace-nowrap">
            “ We Are At Your Service ”
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServiceBannerSection;
