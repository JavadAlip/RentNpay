'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const specs = [
  {
    label: 'Brand',
    value: 'Urban Ladder',
    label2: 'Material',
    value2: 'Premium Fabric',
  },
  {
    label: 'Color',
    value: 'Grey',
    label2: 'Seating Capacity',
    value2: '3 Person',
  },
  {
    label: 'Dimensions',
    value: '78" W x 35" D x 34" H',
    label2: 'Frame Material',
    value2: 'Solid Wood',
  },
  {
    label: 'Cushion Type',
    value: 'High Density Foam',
    label2: 'Weight',
    value2: '45 kg',
  },
  {
    label: 'Assembly Required',
    value: 'No - Fully Assembled',
    label2: 'Warranty',
    value2: 'Covered under rental agreement',
  },
  {
    label: 'Care Instructions',
    value: 'Dry clean only',
    label2: 'Style',
    value2: 'Contemporary',
  },
];

const cancellationText =
  'Free cancellation before delivery. If you cancel after dispatch, a 10% processing fee will be deducted from your refundable deposit. Cancel anytime during the rental period with 7 days notice.';

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-md mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-800">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const RentPrdctDesc = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Product Description */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Product Description
        </h2>
        <AccordionItem title="3-Seater Fabric Sofa - Grey" defaultOpen={true}>
          <p className="text-xs text-gray-600 leading-relaxed mb-2">
            {cancellationText}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {cancellationText}
          </p>
        </AccordionItem>
      </section>

      {/* Product Specifications */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Product Specifications
        </h2>
        <div className="border border-gray-200 rounded-md overflow-x-auto">
          <table className="w-full min-w-[400px] text-left border-collapse">
            <tbody>
              {specs.map((row, i) => (
                <tr
                  key={i}
                  className={i !== specs.length - 1 ? 'border-b border-gray-200' : ''}
                >
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-500 bg-gray-50 w-[22%] sm:w-auto">
                    {row.label}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-800 bg-white">
                    {row.value}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-500 bg-gray-50 w-[22%] sm:w-auto">
                    {row.label2}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-800 bg-white">
                    {row.value2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rental Terms & Policies */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Rental Terms &amp; Policies
        </h2>

        <AccordionItem title="Cancellation Policy" defaultOpen={true}>
          <p className="text-xs text-gray-600 leading-relaxed">
            {cancellationText}
          </p>
        </AccordionItem>

        {/* Damage Policy - collapsed */}
        <div className="border border-gray-200 rounded-md mb-3 overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left">
            <span className="text-sm font-medium text-gray-800">
              Damage Policy
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </button>
        </div>

        {/* Return Process - collapsed */}
        <div className="border border-gray-200 rounded-md mb-3 overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left">
            <span className="text-sm font-medium text-gray-800">
              Return Process
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default RentPrdctDesc;
