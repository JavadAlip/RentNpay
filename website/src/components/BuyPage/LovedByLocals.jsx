import React from 'react';

const testimonials = [
  {
    name: 'Prajwal Shinde',
    role: 'IT Professional',
    text: 'I moved to the city for a 6-month project and didn’t want to buy furniture. Rentnpay let me furnish my entire apartment for just ₹1,500/mo. The zero-deposit option was a lifesaver!',
  },
  {
    name: 'Vikram Deshmukh',
    role: 'Homeowner',
    text: 'My AC broke down in the middle of a heatwave. I booked a technician here, and since the vendor was local, he arrived in just 90 minutes. Professional, verified, and fixed it instantly.',
  },
  {
    name: 'Rahul K.',
    role: 'Student',
    text: 'I was hesitant to buy a refurbished laptop online, but knowing it came from a verified shop just 3km away gave me confidence. I got same-day delivery and a valid warranty card.',
  },
];

const LovedByLocals = () => {
  return (
    <section className="w-full bg-white py-10 sm:py-16 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
              Loved By Locals Like You
            </h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 max-w-xl">
              Join 10,000+ happy neighbors who rent, shop, and book services
              from trusted local stores.
            </p>
          </div>

          {/* Arrow buttons on right */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 text-sm">
              ‹
            </button>
            <button className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-gray-900 bg-gray-900 text-white flex items-center justify-center hover:bg-black text-sm">
              ›
            </button>
          </div>
        </div>

        {/* Cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((item, idx) => (
            <article
              key={idx}
              className="bg-[#f7f7f7] rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col h-full min-w-0"
            >
              <div className="text-orange-500 text-2xl sm:text-3xl mb-3 sm:mb-4">“</div>

              <p className="text-xs sm:text-sm md:text-[15px] text-gray-800 leading-relaxed flex-1">
                {item.text}
              </p>

              <div className="mt-4 sm:mt-6">
                <div className="h-0.5 w-8 sm:w-10 bg-orange-500 mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  {item.name}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LovedByLocals;
