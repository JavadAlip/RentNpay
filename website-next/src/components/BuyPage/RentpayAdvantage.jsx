import React from 'react';

const RentpayAdvantage = () => {
  return (
    <section className="w-full bg-[#f5f5f5] py-10 sm:py-16 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            The Rentnpay Advantage
          </h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 max-w-xl">
            Why we are the smartest way to shop, rent, and book in your city
          </p>
        </div>

        {/* White card with two columns */}
        <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 md:gap-16">
            {/* Left column */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm sm:text-lg shrink-0">
                  ✚
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                  Brand New (Retail Style)
                </h3>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {[
                  'Premium (Standard MRP)',
                  'Brand Warranty',
                  'Unopened Box',
                  'Eligible for Annual Plans',
                ].map((item) => (
                  <div
                    key={item}
                    className="w-full rounded-full bg-[#f7f7f7] px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm sm:text-lg shrink-0">
                  🛡
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                  Buying Used (Certified)
                </h3>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {[
                  'Up to 60% Savings',
                  'Rentnpay Care (Optional)',
                  'Verified Multi-Point Check',
                  '1 Free Service Included',
                ].map((item) => (
                  <div
                    key={item}
                    className="w-full rounded-full bg-[#f7f7f7] px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RentpayAdvantage;
