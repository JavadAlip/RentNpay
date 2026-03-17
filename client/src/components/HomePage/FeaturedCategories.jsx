import React, { useRef } from 'react';
import mainimg from './../../assets/images/Sub Container.png';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  { name: 'Appliances', image: mainimg },
  { name: 'Furniture', image: mainimg },
  { name: 'Electronics', image: mainimg },
  { name: 'Fitness', image: mainimg },
  { name: 'Appliances', image: mainimg },
  { name: 'Furniture', image: mainimg },
];

const FeaturedCategories = () => {
  const sliderRef = useRef();

  const scrollLeft = () => {
    sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
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
            View All Deals
          </button>
        </div>

        {/* Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-6"
          >
            {categories.map((item, index) => (
              <div
                key={index}
                className="min-w-[180px] flex-shrink-0 text-center"
              >
                <div className="bg-white border rounded-xl p-6 hover:shadow-md transition">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-32 object-contain"
                  />
                </div>

                <p className="mt-3 text-gray-800 font-medium">{item.name}</p>
              </div>
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={scrollLeft}
              className="p-2 border rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={scrollRight}
              className="p-2 bg-black text-white rounded-full"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Pagination Line */}
          {/* <div className="w-full h-[2px] bg-gray-200 mt-6 relative">
            <div className="absolute left-0 top-0 h-[2px] w-1/4 bg-black"></div>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
