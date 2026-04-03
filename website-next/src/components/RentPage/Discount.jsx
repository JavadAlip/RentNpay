import React from 'react';
import dis1 from './../../assets/images/dis1.png';
import dis2 from './../../assets/images/dis2.png';

const images = [dis1, dis2];

const Discount = () => {
  return (
    <section className="w-full py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {images.map((img, index) => (
            <div key={index} className="overflow-hidden rounded-xl ">
              <img
                src={img?.src || img}
                alt="discount banner"
                className="w-full h-[400px] object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Discount;
