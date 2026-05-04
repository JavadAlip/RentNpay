import React from 'react';
import { IMG_SERVICE_BANNER as serviceBanner } from '@/lib/assetPlaceholders';
import serviceMainImg from '@/assets/images/service-main.png';

const ServiceBannerSection = () => {
  return (
    <section className="w-full bg-white py-8 sm:py-14 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-6 sm:gap-10">
        {/* Left text */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl  text-gray-900 leading-snug">
            <span className="block font-semibold mb-1 sm:mb-2">
              Expert Services
            </span>
            <span className="block font-semibold mb-1 sm:mb-2">
              Verified Pros
            </span>
            <span className="block font-bold text-orange-500">At Doorstep</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-md mx-auto md:mx-0">
            Book trusted local professionals from shops near you. 🧡
          </p>
        </div>

        {/* Right image + pill button */}
        <div className="flex flex-col items-center leading-none">
          <img
            src={serviceMainImg.src}
            alt="Service professional"
            className="block w-full max-w-[320px] sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl object-contain rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem]"
          />

          <button className="-mt-1 px-5 sm:px-8 md:px-10 py-2 sm:py-2.5 rounded-full bg-[#FF8D28] text-white text-xs sm:text-sm md:text-base font-medium  whitespace-nowrap">
            “ We Are At Your Service ”
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServiceBannerSection;
