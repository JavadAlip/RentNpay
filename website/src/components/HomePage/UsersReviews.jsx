import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const reviews = Array(12).fill({
  name: 'Kalyan Mane',
  role: 'IT professional',
  date: 'March 28, 2025',
  text: "I moved to the city for a 6-month project and didn't want to buy furniture. RentnPay let me furnish my entire apartment for just ₹1,500/mo. The zero-deposit option was a lifesaver!",
});

const UsersReviews = () => {
  const [page, setPage] = useState(0);
  const reviewsPerPage = 6;

  const start = page * reviewsPerPage;
  const visibleReviews = reviews.slice(start, start + reviewsPerPage);

  const next = () => {
    if (start + reviewsPerPage < reviews.length) {
      setPage(page + 1);
    }
  };

  const prev = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  return (
    <section className="w-full py-16 px-4 bg-[#f7f7f7]">
      <div className="max-w-6xl mx-auto relative">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-10">
          What Our Users Say !
        </h2>

        {/* Orange Background Shape */}
        <div className="absolute left-1/2 top-1/2 w-[420px] h-[420px] bg-orange-200 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2 z-0"></div>

        {/* Reviews Grid */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
          {visibleReviews.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition"
            >
              {/* Tag */}
              <p className="text-sm font-medium text-gray-500 mb-3">
                Rental Services
              </p>

              {/* Quote */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.text}
              </p>

              {/* Rating */}
              <div className="flex gap-1 mt-4 text-yellow-400">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} className="text-gray-300" />
              </div>

              {/* User */}
              <div className="flex items-center justify-between mt-6">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>

                <img
                  src="https://i.pravatar.cc/40"
                  className="w-10 h-10 rounded-full"
                  alt="user"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Arrows */}
        <div className="flex justify-center gap-4 mt-10">
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

export default UsersReviews;
