'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

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

const prettifyKey = (key = '') =>
  String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toSpecRows = (product) => {
  const rows = [];

  if (product?.brand) rows.push({ label: 'Brand', value: product.brand });
  if (product?.condition) rows.push({ label: 'Condition', value: product.condition });
  if (product?.category) rows.push({ label: 'Category', value: product.category });
  if (product?.subCategory) rows.push({ label: 'Sub Category', value: product.subCategory });
  if (product?.refundableDeposit != null) {
    rows.push({
      label: 'Refundable Deposit',
      value: `₹${Number(product.refundableDeposit || 0).toLocaleString('en-IN')}`,
    });
  }
  if (product?.logisticsVerification?.city) {
    rows.push({ label: 'Service City', value: product.logisticsVerification.city });
  }

  const specObj = product?.specifications || {};
  Object.entries(specObj).forEach(([k, v]) => {
    if (v == null || String(v).trim() === '') return;
    rows.push({ label: prettifyKey(k), value: String(v) });
  });

  // Preserve 2-column table structure by pairing rows.
  const paired = [];
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i];
    const right = rows[i + 1];
    paired.push({
      label: left?.label || '-',
      value: left?.value || '-',
      label2: right?.label || '-',
      value2: right?.value || '-',
    });
  }

  return paired.length
    ? paired
    : [
        {
          label: 'Product',
          value: product?.productName || '-',
          label2: 'Category',
          value2: product?.category || '-',
        },
      ];
};

const RentPrdctDesc = ({ product }) => {
  const title = product?.productName || 'Product Description';
  const descriptionPrimary =
    product?.description ||
    product?.shortDescription ||
    'No description added by vendor for this product yet.';
  const descriptionSecondary =
    product?.shortDescription && product?.description
      ? product.shortDescription
      : cancellationText;
  const specs = toSpecRows(product);

  const rentalTerms = {
    cancellation: cancellationText,
    damage:
      'Normal wear and tear is covered. Significant accidental or intentional damage may result in repair charges.',
    returns:
      'Return pickup is arranged by our team after scheduling. Please keep the product clean and ready for inspection.',
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Product Description */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Product Description
        </h2>
        <AccordionItem title={title} defaultOpen={true}>
          <p className="text-xs text-gray-600 leading-relaxed mb-2">
            {descriptionPrimary}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {descriptionSecondary}
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
            {rentalTerms.cancellation}
          </p>
        </AccordionItem>

        <AccordionItem title="Damage Policy">
          <p className="text-xs text-gray-600 leading-relaxed">{rentalTerms.damage}</p>
        </AccordionItem>

        <AccordionItem title="Return Process">
          <p className="text-xs text-gray-600 leading-relaxed">{rentalTerms.returns}</p>
        </AccordionItem>
      </section>
    </div>
  );
};

export default RentPrdctDesc;
