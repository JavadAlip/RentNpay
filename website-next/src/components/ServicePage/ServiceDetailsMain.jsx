import React from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  Check,
  Clock,
} from 'lucide-react';
import acMain from '@/assets/images/ac-main.png';
import acMain1 from '@/assets/images/ac-main1.png';
import acMain2 from '@/assets/images/ac-main2.png';
import acMain3 from '@/assets/images/ac-main3.png';

const mainImg = acMain;

const thumbs = [acMain1, acMain2, acMain3];

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
        {/* <div className="text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4">
          Home &gt; Home Services &gt; Appliances
        </div> */}

        {/* Top section: image + details */}
        {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-5 mb-6 sm:mb-8"> */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"> */}
        {/* Left: main image + thumbs */}
        {/* <div className="lg:col-span-2"> */}
        {/* <div>
            <div className="rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={mainImg}
                alt="Split AC service"
                className="w-full h-52 sm:h-64 md:h-72 lg:h-80 object-cover"
              />
            </div>

          
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
            </div>
          </div> */}

        <div className=" rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-5 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-4 lg:gap-6">
            {/* LEFT (Image) */}
            <div>
              <div className="rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={mainImg.src}
                  alt="Split AC service"
                  className="w-full h-52 sm:h-64 md:h-72 lg:h-80 object-cover"
                />
              </div>

              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                  {thumbs.map((img, i) => (
                    <button
                      key={i}
                      className="w-20 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 hover:border-orange-500"
                    >
                      <img
                        src={img.src}
                        alt={`thumb-${i}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: title + price card */}
            <div className="flex flex-col">
              <div className="text-[11px] sm:text-xs text-gray-500  sm:mb-4">
                Home &gt; Home Services &gt; Appliances
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                  Split AC – Advanced Foam Service
                </h1>
                <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-emerald-600">
                  <span className="inline-flex items-center gap-1 bg-[#10B981] text-white px-2 py-[2px] rounded-full">
                    4.8
                    <Star className="w-3 h-3 fill-current" />
                  </span>
                  <span className="text-gray-500">(85 bookings)</span>
                </div>
              </div>

              <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Service Price</p>
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
                  <span className="text-black font-medium">~60 mins</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-700">
                  <span>Visiting Charges</span>

                  <div className="text-right">
                    <span className="text-emerald-600 font-medium block">
                      FREE
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      Waived off on booking
                    </span>
                  </div>
                </div>

                <button className="mt-3 w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 flex items-center justify-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Book now
                </button>
                <div className="mt-4 flex items-center justify-between ">
                  {/* LEFT */}
                  <div>
                    <p className="font-semibold text-base text-center text-[#FF8D28]">
                      100%
                    </p>
                    <p className="text-gray-500 text-xs">Satisfaction</p>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right">
                    <p className="font-semibold text-base text-center text-[#FF8D28]">
                      Same day
                    </p>
                    <p className="text-gray-500 text-xs">Service available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{' '}
      {/* Included / Excluded */}
      <div className="grid grid-cols-1 max-w-6xl mx-auto md:grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              What&apos;s Included
            </h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[2px] flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50">
                  <Check className="w-3 h-3 text-[#10B981]" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#FEF2F2] rounded-2xl border border-[#FFC9C9] p-4 sm:p-5">
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
                <span className="mt-[2px] flex items-center justify-center w-4 h-4 rounded-full bg-[#FFE2E2]">
                  <X className="w-3 h-3 text-[#E7000B]" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Frequently Booked Together */}
      <div className="mb-2 max-w-6xl mx-auto">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Frequently Booked Together
        </h3>
      </div>
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {addOns.map((addon) => (
          <div
            key={addon.title}
            className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex flex-col justify-between"
          >
            <div>
              <p className="text-base sm:text-base font-semibold text-gray-900 mb-1">
                {addon.title}
              </p>
              <p className="text-xs text-gray-500 mb-1">{addon.duration}</p>
              <p className="text-base font-semibold text-[#FF8D28]">
                {addon.price}
              </p>
            </div>
            <button className="mt-3 w-full py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border border-orange-500 text-orange-500 hover:bg-orange-50">
              Add
            </button>
          </div>
        ))}
      </div> */}
      <div className="grid grid-cols-1 max-w-6xl mx-auto sm:grid-cols-3 gap-4">
        {addOns.map((addon) => (
          <div
            key={addon.title}
            className="bg-white rounded-2xl border border-[#E5E7EB]  p-3 sm:p-4 flex flex-col justify-between"
          >
            <div>
              <p className="text-base font-semibold text-gray-900 mb-1">
                {addon.title}
              </p>

              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Clock className="w-3 h-3" />
                <span>{addon.duration}</span>
              </div>

              {/* PRICE + BUTTON SAME ROW */}
              <div className="flex items-center justify-between mt-2">
                <p className="text-base font-semibold text-[#FF8D28]">
                  {addon.price}
                </p>

                <button className="px-3 py-1 text-xs sm:text-sm rounded-lg text-white bg-[#FF8D28]">
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Safety strip */}
      {/* <div className="mt-6 max-w-6xl mx-auto flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>
          All technicians are background-checked and services are backed by
          Rentnpay guarantee.
        </span>
      </div> */}
    </section>
  );
};

export default ServiceDetailsMain;
