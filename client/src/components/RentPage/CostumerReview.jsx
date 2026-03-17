import React from 'react';
import { Star } from 'lucide-react';

const CostumerReview = () => {
  const distribution = [
    { star: 5, value: 90 },
    { star: 4, value: 25 },
    { star: 3, value: 6 },
    { star: 2, value: 2 },
    { star: 1, value: 1 },
  ];

  const reviews = [
    {
      name: 'Priya Sharma',
      avatar: 'https://i.pravatar.cc/40?img=1',
      rating: 5,
      date: 'Feb 5, 2026',
      text: 'Excellent phone! Camera quality is amazing and battery lasts all day. Delivered next day from a local shop. Highly recommend!',
    },
    {
      name: 'Amit Patel',
      avatar: 'https://i.pravatar.cc/40?img=2',
      rating: 5,
      date: 'Feb 3, 2026',
      text: 'Great experience buying from Rahul Electronics. Phone was brand new and sealed. Price was better than online stores!',
    },
    {
      name: 'Neha Desai',
      avatar: 'https://i.pravatar.cc/40?img=3',
      rating: 4,
      date: 'Jan 30, 2026',
      text: 'Very good phone, loving the new design and features. Only wish the charger was included in the box.',
    },
  ];

  return (
    <section className="bg-gray-100 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h2 className="text-xl font-semibold mb-8">Customer Reviews</h2>

        {/* Top Cards - same row on all screens, responsive sizing */}
        <div className="flex flex-row gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Rating Card - 40% */}
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-center shadow-sm w-[40%] min-w-0 shrink-0">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">4.8</h3>

            <div className="flex justify-center mb-1 sm:mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={`sm:w-[18px] sm:h-[18px] ${
                    i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs sm:text-sm text-gray-500">124 Ratings</p>
          </div>

          {/* Rating Distribution - 60% */}
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm w-[60%] min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-4">Rating Distribution</h4>

            {distribution.map((item) => (
              <div key={item.star} className="flex items-center mb-1.5 sm:mb-3">
                <span className="text-xs sm:text-sm w-5 sm:w-6 shrink-0">{item.star}★</span>

                <div className="flex-1 mx-2 sm:mx-3 bg-gray-200 h-1.5 sm:h-2 rounded min-w-0">
                  <div
                    className="bg-green-500 h-1.5 sm:h-2 rounded"
                    style={{ width: `${item.value}%` }}
                  />
                </div>

                <span className="text-[10px] sm:text-xs text-gray-500 w-4 sm:w-6 shrink-0 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Reviews */}
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 flex gap-4 items-start shadow-sm"
            >
              {/* Avatar */}
              <img
                src={review.avatar}
                alt={review.name}
                className="w-10 h-10 rounded-full"
              />

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-sm">{review.name}</h4>

                    <div className="flex">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className="text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                  </div>

                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>

                <p className="text-sm text-gray-500 mt-2">{review.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CostumerReview;
