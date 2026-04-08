'use client';

import React from 'react';

const prettifyKey = (key = '') =>
  String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toSpecRows = (product) => {
  const rows = [];
  const v0 =
    Array.isArray(product?.variants) && product.variants.length
      ? product.variants[0]
      : null;

  if (v0?.color) rows.push({ label: 'Color', value: v0.color });
  if (v0?.storage) rows.push({ label: 'Storage', value: v0.storage });
  if (v0?.ram) rows.push({ label: 'RAM', value: v0.ram });

  const specObj = product?.specifications || {};
  Object.entries(specObj).forEach(([key, value]) => {
    if (value == null || String(value).trim() === '') return;
    rows.push({ label: prettifyKey(key), value: String(value) });
  });

  if (!rows.length) {
    rows.push({
      label: 'Model',
      value: product?.productName || '—',
    });
  }

  return rows;
};

const BuyPrdctDesc = ({ product }) => {
  const rows = toSpecRows(product);
  const specPairs = [];
  for (let i = 0; i < rows.length; i += 2) {
    specPairs.push([rows[i], rows[i + 1] || null]);
  }
  const productName = product?.productName || 'Product';
  const description =
    product?.description ||
    'Detailed product description will be available soon for this listing.';

  return (
    <section className="w-full bg-white py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Product Description
          </h2>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
            <p className="text-base font-semibold text-gray-900 mb-3">
              {productName}
            </p>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
              {description}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
            Product Specifications
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            <table className="min-w-full text-sm">
              <tbody>
                {specPairs.map(([left, right], idx) => (
                  <tr key={`${left.label}-${idx}`} className="border-b border-gray-100">
                    <td className="w-1/4 px-4 py-3 font-medium text-gray-700 align-top">
                      {left.label}
                    </td>
                    <td className="w-1/4 px-4 py-3 text-gray-800 align-top">
                      {left.value}
                    </td>
                    <td className="w-1/4 px-4 py-3 font-medium text-gray-700 align-top">
                      {right?.label || ''}
                    </td>
                    <td className="w-1/4 px-4 py-3 text-gray-800 align-top">
                      {right?.value || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuyPrdctDesc;

