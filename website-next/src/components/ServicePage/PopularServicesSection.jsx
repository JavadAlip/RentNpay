import React from 'react';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  IndianRupee,
  Clock,
} from 'lucide-react';

const services = [
  {
    title: 'AC Repair Services',
    rating: '4.8',
    reviews: '120 Reviews',
    desc: 'Includes filter cleaning, gas check, and outdoor unit wash.',
    price: '₹599',
    old: '599',
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600',
  },
  {
    title: 'Plumbing Services',
    rating: '4.8',
    reviews: '120 Reviews',
    desc: 'Includes filter cleaning, gas check, and outdoor unit wash.',
    price: '₹599',
    old: '599',
    img: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?q=80&w=600',
  },
  {
    title: 'AC Repair Services',
    rating: '4.8',
    reviews: '120 Reviews',
    desc: 'Includes filter cleaning, gas check, and outdoor unit wash.',
    price: '₹599',
    old: '599',
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600',
  },
];

const ServicesLanding = () => {
  return (
    <div className="bg-[#F7F7F7] min-h-screen py-8 sm:py-12 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-semibold mb-6 sm:mb-8">
          Popular Services Near You
        </h2>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center bg-white border rounded-full px-3 sm:px-4 py-2.5 sm:py-3 w-full min-w-0 shadow-sm">
            <Search size={18} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Try Searching - Samsung Washing Machine"
              className="outline-none w-full min-w-0 text-xs sm:text-sm bg-transparent"
            />
          </div>
          <div className="flex items-center justify-center sm:justify-start text-xs sm:text-sm text-gray-600 whitespace-nowrap">
            <MapPin size={14} className="text-orange-500 mr-1 shrink-0 sm:w-4 sm:h-4" />
            Deliver to Sadashiv Peth, Pune
          </div>
        </div>

        <div className="text-right text-xs sm:text-sm text-orange-500 mb-3 sm:mb-4 cursor-pointer">
          View All Services →
        </div>

        {/* Service Cards */}
        <div className="space-y-4 sm:space-y-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-lg sm:rounded-xl shadow-sm border p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-0">
                <img
                  src={service.img}
                  alt=""
                  className="w-full sm:w-28 h-32 sm:h-20 object-cover rounded-md shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">{service.title}</h3>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-1 flex-wrap gap-1">
                    <span className="bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-[2px] rounded flex items-center w-fit">
                      <Star size={10} className="mr-0.5 sm:mr-1 fill-white shrink-0" />
                      {service.rating}
                    </span>
                    <span>({service.reviews})</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1 max-w-sm">
                    {service.desc}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-orange-500 mt-2">
                    <span>Professional Service</span>
                    <span>Same Day Available</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col md:flex-col items-center justify-between sm:items-end gap-2 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] sm:text-xs text-gray-400">Starting from</p>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-xl font-semibold">{service.price}</span>
                    <span className="text-gray-400 line-through text-xs sm:text-sm">{service.old}</span>
                  </div>
                </div>
                <button className="bg-orange-500 text-white text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2 rounded-md hover:bg-orange-600 shrink-0">
                  Add Service
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Why Choose */}
        <div className="mt-10 sm:mt-16 text-center">
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-10">
            Why Choose Our Services
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-500 p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-white mb-3 sm:mb-4">
                <ShieldCheck size={22} />
              </div>
              <h4 className="font-semibold mb-1 text-sm sm:text-base">Verified Professionals</h4>
              <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
                All service providers are background-checked and certified
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-500 p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-white mb-3 sm:mb-4">
                <IndianRupee size={18} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <h4 className="font-semibold mb-1 text-sm sm:text-base">Transparent Pricing</h4>
              <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
                No hidden charges. What you see is what you pay
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-500 p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-white mb-3 sm:mb-4">
                <Clock size={22} />
              </div>
              <h4 className="font-semibold mb-1 text-sm sm:text-base">On-Time Guarantee</h4>
              <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
                Professionals arrive on time or we compensate you
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesLanding;
