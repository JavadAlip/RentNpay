// import React from 'react';

// export default function BuyOfferBanner() {
//   return (
//     <section className="w-full bg-gray-50 px-3 sm:px-4 py-6 sm:py-10">
//       <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden relative min-h-[200px] sm:min-h-[260px]">
//         <img
//           src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=1400&q=80"
//           alt="Offer banner"
//           className="absolute inset-0 w-full h-full object-cover"
//         />
//         <div className="absolute inset-0 bg-black/55" />
//         <div className="relative z-10 p-6 sm:p-10 text-white max-w-xl">
//           <p className="text-sm text-emerald-400 font-semibold">Categories</p>
//           <h3 className="text-3xl sm:text-5xl font-semibold mt-2 leading-tight">
//             Enhance Your <br /> Music Experience
//           </h3>
//           <button className="mt-6 bg-emerald-400 text-black font-semibold px-7 py-2.5 rounded">
//             Buy Now!
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// }

import React from 'react';
import jblSpeaker from '@/assets/images/jbl-speaker.png';

export default function BuyOfferBanner() {
  return (
    <section className="w-full bg-gray-50 px-3 sm:px-4 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden bg-black min-h-[320px] sm:min-h-[420px] lg:min-h-[480px] flex items-center justify-between px-6 sm:px-12">
        {/* LEFT CONTENT */}
        <div className="text-white max-w-xl space-y-7 sm:space-y-8">
          <p className="text-sm text-emerald-400 font-semibold">Categories</p>

          <h3 className="text-2xl sm:text-5xl font-semibold leading-tight">
            Enhance Your <br /> Music Experience
          </h3>

          {/* TIMER */}
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
            {[
              { label: 'Days', value: '05' },
              { label: 'Hours', value: '23' },
              { label: 'Minutes', value: '59' },
              { label: 'Seconds', value: '35' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white text-black rounded-full w-14 h-14 sm:w-20 sm:h-20 flex flex-col items-center justify-center shadow-sm"
              >
                <p className="text-sm sm:text-lg font-semibold">{item.value}</p>
                <p className="text-[8px] sm:text-xs leading-none">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* BUTTON */}
          <button className="mt-2 bg-emerald-400 text-black font-semibold px-7 py-3 rounded-lg hover:bg-emerald-300 transition">
            Buy Now!
          </button>
        </div>

        {/* RIGHT IMAGE */}
        <div className="hidden md:flex justify-end items-center h-full flex-1">
          <img
            src={jblSpeaker.src}
            alt="JBL Speaker"
            className="max-h-[260px] object-contain"
          />
        </div>
      </div>
    </section>
  );
}
