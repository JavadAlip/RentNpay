import React from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { Wallet, Wrench, Car } from 'lucide-react';

const RentMain = () => {
  return (
    <div className="w-full bg-white font-manrope">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Hero Banner */}
        <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8 min-h-[160px] sm:min-h-[200px] md:min-h-[220px]">
          <img
            src={mainimg}
            alt="Rent The Set"
            className="w-full h-full min-h-[160px] sm:min-h-[200px] md:min-h-[220px] object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-black/40 rounded-xl sm:rounded-2xl" />

          <div className="relative z-10 p-4 sm:p-6 md:p-8 flex flex-col justify-center min-h-[160px] sm:min-h-[200px] md:min-h-[220px]">
            <h1 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-0.5 sm:mb-1">
              Rent The Set For
            </h1>
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
              ₹1,299/Mo
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mb-3 sm:mb-5">
              Maintenance Included — 4 visits per year
            </p>
            <button
              className="w-fit px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm font-semibold shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: '#F5A623' }}
            >
              Rent Now
            </button>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center mb-6">
          <p className="text-gray-800 text-lg font-medium">
            Don&apos;t Just Rent An Item. Rent A{' '}
            <span style={{ color: '#F5A623' }} className="font-bold">
              Lifestyle !
            </span>
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-10">
          {[
            { icon: Wallet, label: 'Financial Freedom' },
            { icon: Wrench, label: 'Zero Repairs' },
            { icon: Car, label: 'Total Mobility' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white shadow-md border border-gray-100 text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              <span
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#F5A623' }}
              >
                <Icon size={14} color="white" strokeWidth={2.5} />
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RentMain;
