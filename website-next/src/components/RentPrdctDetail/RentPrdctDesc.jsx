'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

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

  // Variant specs (color/storage/ram) are stored under `product.variants[]`
  // and are not part of `product.specifications`.
  const v0 =
    Array.isArray(product?.variants) && product.variants.length
      ? product.variants[0]
      : null;

  const specObj = product?.specifications || {};
  const specKeysLower = Object.keys(specObj).map((k) =>
    String(k).toLowerCase(),
  );
  const hasSpecKey = (pred) => specKeysLower.some((k) => pred(k));

  const showVariantColor =
    !!v0?.color &&
    !hasSpecKey(
      (k) =>
        k === 'color' ||
        k === 'colour' ||
        k.includes('color') ||
        k.includes('colour'),
    );
  const showVariantStorage =
    !!v0?.storage &&
    !hasSpecKey(
      (k) =>
        k === 'storage' ||
        k.includes('storage') ||
        k.includes('capacity') ||
        k.includes('ssd') ||
        k.includes('hdd'),
    );
  const showVariantRam =
    !!v0?.ram &&
    !hasSpecKey(
      (k) => k === 'ram' || k.includes('ram') || k.includes('memory'),
    );

  if (showVariantColor) rows.push({ label: 'Color', value: v0.color });
  if (showVariantStorage) rows.push({ label: 'Storage', value: v0.storage });
  if (showVariantRam) rows.push({ label: 'RAM', value: v0.ram });

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
  const title = product?.productName || 'Product description';
  const desc = String(product?.description || '').trim();
  const short = String(product?.shortDescription || '').trim();

  const descriptionPrimary =
    desc || short || 'No description added by the renter for this listing yet.';

  const descriptionSecondary = desc && short && short !== desc;

  const specs = toSpecRows(product);

  const rentalTiers = Array.isArray(product?.rentalConfigurations)
    ? product.rentalConfigurations
    : [];
  const rentalSummary =
    rentalTiers.length > 0
      ? rentalTiers
          .map((cfg) => {
            const months = Number(cfg?.months) || 0;
            const days = Number(cfg?.days) || 0;
            const unit = cfg?.periodUnit === 'day' ? 'day' : 'month';
            const rent =
              Number(cfg?.customerRent) > 0
                ? Number(cfg.customerRent)
                : Number(cfg?.pricePerDay) || 0;
            const tenure =
              unit === 'day' && days > 0
                ? `${days} days`
                : months > 0
                  ? `${months} months`
                  : 'Tier';
            const suffix =
              unit === 'day' && days > 0
                ? `/${days}d`
                : months > 0
                  ? `/${months}month`
                  : '/mo';
            return rent > 0 ? `${tenure}: ₹${rent}${suffix}` : null;
          })
          .filter(Boolean)
          .join(' · ')
      : '';

  const rentalTerms = {
    cancellation:
      'Free cancellation before delivery. If you cancel after dispatch, a 10% processing fee will be deducted from your refundable deposit. Cancel anytime during the rental period with 7 days notice.',
    damage:
      'Normal wear and tear is covered. Significant accidental or intentional damage may result in repair charges deducted from the refundable deposit where applicable.',
    returns:
      'Return pickup is coordinated after your rental term ends. Please keep the item clean and ready for inspection.',
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
          Product specifications
        </h2>
        <div className="border border-gray-200 rounded-md overflow-x-auto">
          <table className="w-full min-w-[400px] text-left border-collapse">
            <tbody>
              {specs.map((row, i) => (
                <tr
                  key={i}
                  className={
                    i !== specs.length - 1 ? 'border-b border-gray-200' : ''
                  }
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
          <p className="text-xs text-gray-600 leading-relaxed">
            {rentalTerms.damage}
          </p>
        </AccordionItem>

        <AccordionItem title="Return Process">
          <p className="text-xs text-gray-600 leading-relaxed">
            {rentalTerms.returns}
          </p>
        </AccordionItem>
      </section>
    </div>
  );
};

export default RentPrdctDesc;
