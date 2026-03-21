import React from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';

const categories = [
  { title: 'The Digital Creator' },
  { title: 'Heavy-Duty Construction' },
  { title: 'The Event Pro' },
  { title: 'Work From Home' },
  { title: 'The Tech Sandbox' },
  { title: 'Guest-Ready Home' },
  { title: 'Home Gym Resolution' },
  { title: 'Bachelor Essentials' },
];

const ShopsAsPerNeeds = () => {
  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h2 className="text-xl md:text-2xl font-semibold mb-10">
          Shop As Per Your Needs !
        </h2>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                  <img
                    src={mainimg}
                    alt={item.title}
                    className="w-10 h-10 object-contain"
                  />
                </div>

                <p className="text-xs md:text-sm mt-3 text-gray-700">
                  {item.title}
                </p>
              </div>
            ))}
          </div>

          {/* Right Images Layout - hidden on small screens */}
          <div className="hidden md:flex relative w-full h-[380px] items-center justify-center">
            {/* Top Image */}
            <img
              src={mainimg}
              alt="service1"
              className="absolute top-0 left-10 w-[260px] md:w-[300px] rounded-xl shadow-md object-cover"
            />

            {/* Bottom Image */}
            <img
              src={mainimg}
              alt="service2"
              className="absolute bottom-0 right-10 w-[260px] md:w-[300px] rounded-xl shadow-md object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopsAsPerNeeds;
