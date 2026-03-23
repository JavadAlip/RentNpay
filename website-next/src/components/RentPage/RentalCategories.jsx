// import React, { useState } from 'react';
// import mainimg from './../../assets/images/Sub Container.png';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// const categories = [
//   { name: 'Living Room', image: mainimg },
//   { name: 'Bedroom', image: mainimg },
//   { name: 'WFH Setup', image: mainimg },
//   { name: 'Appliances', image: mainimg },
//   { name: 'Fitness', image: mainimg },
//   { name: 'Fashion', image: mainimg },
//   { name: 'Vehicles', image: mainimg },
//   { name: 'Hardware', image: mainimg },
//   { name: 'Gaming', image: mainimg },
//   { name: 'Kitchen', image: mainimg },
//   { name: 'Office', image: mainimg },
//   { name: 'Outdoor', image: mainimg },
//   { name: 'Decor', image: mainimg },
//   { name: 'Lighting', image: mainimg },
// ];

// const ITEMS_PER_PAGE = 12;

// const RentalCategories = () => {
//   const [page, setPage] = useState(0);

//   const start = page * ITEMS_PER_PAGE;
//   const visibleItems = categories.slice(start, start + ITEMS_PER_PAGE);

//   const next = () => {
//     if (start + ITEMS_PER_PAGE < categories.length) {
//       setPage(page + 1);
//     }
//   };

//   const prev = () => {
//     if (page > 0) {
//       setPage(page - 1);
//     }
//   };

//   return (
//     <section className="w-full py-16 px-4 bg-gray-50">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 sm:mb-10 gap-4">
//           <div>
//             <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
//               Featured Categories
//             </h2>
//             <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-lg">
//               Explore the most popular rentals, verified used electronics, and
//               top-rated services in your neighborhood
//             </p>
//           </div>

//           <button className="bg-black text-white px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm w-fit whitespace-nowrap">
//             View All Categories
//           </button>
//         </div>

//         {/* Categories Grid */}
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
//           {visibleItems.map((item, index) => (
//             <div key={index} className="text-center">
//               <div className="bg-white border rounded-xl p-6 hover:shadow-md transition">
//                 <img
//                   src={item.image}
//                   alt={item.name}
//                   className="w-full h-20 object-contain"
//                 />
//               </div>

//               <p className="mt-3 text-gray-800 font-medium text-sm">
//                 {item.name}
//               </p>
//             </div>
//           ))}
//         </div>

//         {/* Arrows */}
//         <div className="flex items-center justify-center gap-3 mt-10">
//           <button
//             onClick={prev}
//             className="p-2 border rounded-full hover:bg-gray-100"
//           >
//             <ChevronLeft size={18} />
//           </button>

//           <button
//             onClick={next}
//             className="p-2 bg-black text-white rounded-full"
//           >
//             <ChevronRight size={18} />
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default RentalCategories;

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IMG_SUB as mainimg } from '@/lib/assetPlaceholders';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGetCategories } from '../../lib/api';
import { useRouter } from 'next/navigation';

const RentalCategories = () => {
  const sliderRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiGetCategories()
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.categories || [];
        setCategories(list);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const scrollLeft = () =>
    sliderRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  const scrollRight = () =>
    sliderRef.current?.scrollBy({ left: 300, behavior: 'smooth' });

  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
              Rental Categories
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-lg">
              Explore the most popular rentals, verified used electronics, and
              top-rated services in your neighborhood
            </p>
          </div>
          <button
            onClick={() => router.push('/products')}
            className="bg-black text-white px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm w-fit whitespace-nowrap"
          >
            View All Categories
          </button>
        </div>

        {/* Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          >
            {loading ? (
              // Skeleton loaders
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="min-w-[150px] flex-shrink-0 text-center animate-pulse"
                >
                  <div className="bg-gray-200 rounded-xl h-[120px] w-full" />
                  <div className="mt-3 h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                </div>
              ))
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500 py-8">No categories found.</p>
            ) : (
              categories.map((item, index) => (
                <div
                  key={item._id || index}
                  onClick={() => router.push(`/products?category=${item.name}`)}
                  className="min-w-[150px] flex-shrink-0 text-center cursor-pointer group"
                >
                  <div className="bg-white border rounded-xl p-5 hover:shadow-md hover:border-orange-300 transition-all">
                    <img
                      src={item.image || mainimg}
                      alt={item.name}
                      className="w-full h-20 object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = mainimg;
                      }}
                    />
                  </div>
                  <p className="mt-3 text-gray-800 font-medium text-sm group-hover:text-orange-500 transition-colors">
                    {item.name}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Arrows */}
          {!loading && categories.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={scrollLeft}
                className="p-2 border rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={scrollRight}
                className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RentalCategories;
