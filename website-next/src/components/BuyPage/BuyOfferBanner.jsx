import React from 'react';

export default function BuyOfferBanner() {
  return (
    <section className="w-full bg-gray-50 px-3 sm:px-4 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden relative min-h-[200px] sm:min-h-[260px]">
        <img
          src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=1400&q=80"
          alt="Offer banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 p-6 sm:p-10 text-white max-w-xl">
          <p className="text-sm text-emerald-400 font-semibold">Categories</p>
          <h3 className="text-3xl sm:text-5xl font-semibold mt-2 leading-tight">
            Enhance Your <br /> Music Experience
          </h3>
          <button className="mt-6 bg-emerald-400 text-black font-semibold px-7 py-2.5 rounded">
            Buy Now!
          </button>
        </div>
      </div>
    </section>
  );
}
