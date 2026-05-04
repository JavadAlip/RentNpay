import React from 'react';
import {
  Search,
  MapPin,
  Wrench,
  Sparkles,
  Plug,
  Monitor,
  Hammer,
  Droplets,
} from 'lucide-react';
import electronicsIcon from '@/assets/icons/Electronics.png';
import installationIcon from '@/assets/icons/installation.png';

const services = [
  {
    label: 'Appliance Repair',
    Icon: Wrench,
  },
  {
    label: 'Home Cleaning',
    Icon: Sparkles,
  },
  {
    label: 'Installation',
    image: installationIcon,
  },
  {
    label: 'Electronics Repair',
    image: electronicsIcon,
  },
  {
    label: 'Carpentry',
    Icon: Hammer,
  },
  {
    label: 'Plumbing',
    Icon: Droplets,
  },
];
//   {
//     label: 'Appliance Repair',
//     Icon: Wrench,
//   },
//   {
//     label: 'Home Cleaning',
//     Icon: Sparkles,
//   },
//   {
//     label: 'Installation',
//     Icon: Plug,
//   },
//   {
//     label: 'Electronics Repair',
//     Icon: electronicsIcon,
//   },
//   {
//     label: 'Carpentry',
//     Icon: Hammer,
//   },
//   {
//     label: 'Plumbing',
//     Icon: Droplets,
//   },
// ];

const NeedHelpSection = () => {
  return (
    <section className="w-full bg-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Search and delivery bar */}
        {/* <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-0">
          <div className="relative flex-1 min-w-0 rounded-full sm:rounded-r-none border border-gray-200 bg-white shadow-sm sm:border-r-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              placeholder='Try "Samsung Washing Machine"'
              className="w-full pl-11 pr-4 py-3 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 border-0 rounded-full sm:rounded-r-none focus:ring-0"
              aria-label="Search for products or services"
            />
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-full sm:rounded-l-none border border-gray-200 sm:border-l-0 bg-white shadow-sm text-sm text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
            aria-label="Change delivery location"
          >
            <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="truncate">Deliver to Sadashiv Peth, Pune</span>
            <span className="text-gray-400 shrink-0" aria-hidden>
              ▾
            </span>
          </button>
        </div> */}
        <div className="flex flex-col sm:flex-row w-full gap-2">
          {/* Search input */}
          <div className="relative flex-1 min-w-0 rounded-full border border-[#99A1AF] bg-white shadow-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder='Try "Samsung Washing Machine"'
              className="w-full pl-11 pr-4 py-3 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 rounded-full"
            />
          </div>

          {/* Delivery location */}
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-gray-200 bg-white shadow-sm text-sm text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
          >
            <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="truncate">Deliver to Sadashiv Peth, Pune</span>
            <span className="text-gray-400 shrink-0">▾</span>
          </button>
        </div>

        {/* Heading */}
        <div className="mt-10 mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            What do you need help with?
          </h2>
        </div>

        {/* Orange circular icons row */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-10">
          {/* {services.map(({ label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#FF8D28] flex items-center justify-center text-white">
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-gray-800 text-center">
                {label}
              </p>
            </div>
          ))} */}
          {services.map(({ label, Icon, image }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#FF8D28] flex items-center justify-center text-white">
                {image ? (
                  <img
                    src={image.src}
                    alt={label}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-800 text-center">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NeedHelpSection;
