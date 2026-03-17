import React, { useState } from 'react';
import mainimg from './../../assets/images/Sub Container.png';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  { name: 'Living Room', image: mainimg },
  { name: 'Bedroom', image: mainimg },
  { name: 'WFH Setup', image: mainimg },
  { name: 'Appliances', image: mainimg },
  { name: 'Fitness', image: mainimg },
  { name: 'Fashion', image: mainimg },
  { name: 'Vehicles', image: mainimg },
  { name: 'Hardware', image: mainimg },
  { name: 'Gaming', image: mainimg },
  { name: 'Kitchen', image: mainimg },
  { name: 'Office', image: mainimg },
  { name: 'Outdoor', image: mainimg },
  { name: 'Decor', image: mainimg },
  { name: 'Lighting', image: mainimg },
];

const ITEMS_PER_PAGE = 12;

const RentalCategories = () => {
  const [page, setPage] = useState(0);

  const start = page * ITEMS_PER_PAGE;
  const visibleItems = categories.slice(start, start + ITEMS_PER_PAGE);

  const next = () => {
    if (start + ITEMS_PER_PAGE < categories.length) {
      setPage(page + 1);
    }
  };

  const prev = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
              Featured Categories
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-lg">
              Explore the most popular rentals, verified used electronics, and
              top-rated services in your neighborhood
            </p>
          </div>

          <button className="bg-black text-white px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm w-fit whitespace-nowrap">
            View All Categories
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {visibleItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className="bg-white border rounded-xl p-6 hover:shadow-md transition">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-20 object-contain"
                />
              </div>

              <p className="mt-3 text-gray-800 font-medium text-sm">
                {item.name}
              </p>
            </div>
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={prev}
            className="p-2 border rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={next}
            className="p-2 bg-black text-white rounded-full"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default RentalCategories;
