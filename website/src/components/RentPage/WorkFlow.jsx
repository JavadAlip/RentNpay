import React from 'react';
import { Search, Calendar, Package, Wrench } from 'lucide-react';

const WorkFlow = () => {
  const steps = [
    {
      icon: Search,
      title: 'Select Your Gear',
      desc: 'Browse and pick products',
    },
    {
      icon: Calendar,
      title: 'Choose Your Tenure',
      desc: 'Pick monthly or daily',
    },
    {
      icon: Package,
      title: 'Fast Doorstep Setup',
      desc: 'Delivery in 1-3 days',
    },
    {
      icon: Wrench,
      title: 'Enjoy Ongoing Support',
      desc: 'Included maintenance and reminders',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-10 sm:mb-16">
          How Do <span className="text-orange-500">RentNPay</span> Work
        </h2>

        {/* Steps - 2 per row on small, 4 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 text-center">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={index} className="flex flex-col items-center">
                {/* Icon Circle */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center rounded-full bg-gray-100 mb-3 sm:mb-6">
                  <Icon size={32} className="text-orange-500" />
                </div>

                {/* Title */}
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{step.title}</h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-500 max-w-[140px] sm:max-w-[180px] mx-auto">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WorkFlow;
