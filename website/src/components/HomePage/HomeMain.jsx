import React from 'react';
import mainimg from './../../assets/images/Sub Container.png';

const HomeMain = () => {
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
            repairs. Delivered from verified shops near you.
          </p>

          <div className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center md:justify-start">
            <button className="bg-gray-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 transition whitespace-nowrap">
              Buy Now
            </button>

            <button className="border border-gray-300 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-100 transition whitespace-nowrap">
              Contact Us
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div className="flex justify-center">
          <img
            src={mainimg}
            alt="product"
            className="w-full max-w-md lg:max-w-lg object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default HomeMain;
