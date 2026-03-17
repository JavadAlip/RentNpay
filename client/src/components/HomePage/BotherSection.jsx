import React from 'react';
import sofa from './../../assets/images/sofa.png';
import washing from './../../assets/images/washing-machine.png';
import tools from './../../assets/images/tools.png';

const BotherSection = () => {
  return (
    <section className="w-full py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-10">
          What's Bothering You ?
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT BIG CARD */}
          <div className="border-2 border-orange-400 rounded-xl p-6 flex flex-col justify-between min-h-[360px] relative overflow-hidden">
            <div>
              <p className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full inline-block mb-4">
                Starts @ ₹99/mo
              </p>

              <h3 className="text-xl font-semibold mb-2">Renting →</h3>

              <p className="text-sm text-gray-600 mb-4">
                Upgrade your lifestyle without the commitment. Free relocation &
                maintenance included.
              </p>

              <ul className="text-sm text-gray-700 space-y-1">
                <li>Bedroom Packages</li>
                <li>Living Room</li>
                <li>Office</li>
                <li>Workstations</li>
                <li>Home Appliances</li>
                <li>Fitness Gear</li>
              </ul>
            </div>

            {/* Image */}
            <img
              src={sofa}
              alt="sofa"
              className="absolute bottom-0 right-0 w-48 md:w-60 object-contain"
            />
          </div>

          {/* RIGHT SIDE */}
          <div className="grid grid-rows-2 gap-6">
            {/* BUY NEW CARD */}
            <div className="border-2 border-orange-400 rounded-xl p-6 flex justify-between items-center relative overflow-hidden min-h-[180px] sm:min-h-0">
              <div className="relative z-10 pr-32 sm:pr-0 min-w-0">
                <p className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full inline-block mb-3">
                  Verified Local Shops
                </p>

                <h3 className="text-lg font-semibold">Buy New & Used →</h3>

                <p className="text-sm text-gray-600 mt-2 max-w-[200px]">
                  Shop brand new or certified refurbished items from stores near
                  you
                </p>
              </div>

              <img
                src={washing}
                alt="washing"
                className="absolute right-0 bottom-0 w-36 sm:top-0 sm:bottom-auto sm:right-0 sm:w-44 md:-right-6 md:w-80 object-contain"
              />
            </div>

            {/* BOOK SERVICES */}
            <div className="border-2 border-orange-400 rounded-xl p-6 flex justify-between items-center relative overflow-hidden">
              <div>
                <p className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full inline-block mb-3">
                  Arrives in 2Hrs
                </p>

                <h3 className="text-lg font-semibold">Book Services →</h3>

                <p className="text-sm text-gray-600 mt-2 max-w-[200px]">
                  Verified professionals for repairs, cleaning, and installation
                </p>
              </div>

              <img
                src={tools}
                alt="tools"
                className="absolute -right-6 bottom-0 w-40 md:w-48 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BotherSection;
