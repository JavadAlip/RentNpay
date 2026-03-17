import React from 'react';
import { Star, MapPin, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

const mainImg =
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80';

const thumbs = [
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1588061884087-61a9a76eab02?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1603575448360-3f089096f4f1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
];

const included = [
  'Complete filter cleaning and sanitization',
  'Gas pressure check and top-up (if needed)',
  'Outdoor unit wash and debris removal',
  'Cooling efficiency testing',
  'Drain pipe cleaning',
  'Remote and thermostat check',
];

const excluded = [
  'Spare parts cost (charged separately if needed)',
  'Gas refill charges (if major leak detected)',
  'Electrical wiring repairs',
];

const addOns = [
  {
    title: 'AC Gas Refill (R32)',
    duration: '45–60 mins',
    price: '₹2,500',
  },
  {
    title: 'AC Uninstallation Service',
    duration: '30–45 mins',
    price: '₹499',
  },
  {
    title: 'Window AC Service',
    duration: '30–45 mins',
    price: '₹399',
  },
];

const ServiceDetailsMain = () => {
  return (
    <section className="w-full bg-gray-50 py-8 sm:py-10 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4">
          Home &gt; Home Services &gt; Appliances
        </div>

        {/* Top section: image + details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-5 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left: main image + thumbs */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={mainImg}
                  alt="Split AC service"
                  className="w-full h-52 sm:h-64 md:h-72 lg:h-80 object-cover"
                />
              </div>

              {/* Thumbnails + location/search (simplified) */}
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                  {thumbs.map((src, i) => (
                    <button
                      key={i}
                      className="w-20 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 hover:border-orange-500"
                    >
                      <img
                        src={src}
                        alt={`thumb-${i}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                <button className="inline-flex items-center justify-center gap-2 text-[11px] sm:text-xs md:text-sm px-3 sm:px-4 py-2 rounded-full border border-gray-200 bg-gray-50 whitespace-nowrap">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>Delivering to Pune 411057</span>
                </button>
              </div>
            </div>

            {/* Right: title + price card */}
            <div className="flex flex-col gap-3">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                  Split AC – Advanced Foam Service
                </h1>
                <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-emerald-600">
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-[2px] rounded-full">
                    <Star className="w-3 h-3 fill-current" />
                    4.8
                  </span>
                  <span className="text-gray-500">(85 bookings)</span>
                </div>
              </div>

              <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Service Price</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                      ₹599
                    </p>
                    <p className="text-xs text-gray-400 line-through">₹799</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Estimated Duration</span>
                  </div>
                  <span className="text-emerald-600 font-medium">~60 mins</span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-700">
                  <span>Visiting Charges</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>

                <button className="mt-3 w-full py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Included / Excluded */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                What&apos;s Included
              </h2>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[2px] text-emerald-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#fff7f7] rounded-2xl border border-red-100 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-4 flex items-center justify-center text-red-500 text-sm">
                ✕
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                What&apos;s Excluded
              </h2>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
              {excluded.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[2px] text-red-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Frequently Booked Together */}
        <div className="mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Frequently Booked Together
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {addOns.map((addon) => (
            <div
              key={addon.title}
              className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs text-gray-500 mb-1">{addon.duration}</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                  {addon.title}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {addon.price}
                </p>
              </div>
              <button className="mt-3 w-full py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border border-orange-500 text-orange-500 hover:bg-orange-50">
                Add
              </button>
            </div>
          ))}
        </div>

        {/* Safety strip */}
        <div className="mt-6 flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>
            All technicians are background-checked and services are backed by
            Rentnpay guarantee.
          </span>
        </div>
      </div>
    </section>
  );
};

export default ServiceDetailsMain;
