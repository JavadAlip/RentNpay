'use client';

import Link from 'next/link';

const parsePrice = (raw) => {
  const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

const ProductCard = ({ product, offer }) => {
  const { _id, productName, image, price, type, category, subCategory, stock } =
    product;
  const base = parsePrice(price);
  const discount = Number(offer?.discountPercent || 0);
  const hasOffer = discount > 0;
  const finalPrice = hasOffer
    ? Math.max(0, Math.round(base - (base * discount) / 100))
    : base;

  return (
    <Link
      href={`/rent-product-details/${_id}`}
      className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all"
    >
      {/* Image */}
      <div className="relative h-48 sm:h-52 bg-gray-100 overflow-hidden">
        {hasOffer ? (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center px-2 py-0.5 rounded-lg border text-xs font-medium text-[#F97316] border-[#F97316] bg-white">
            {discount}% Off
          </span>
        ) : null}
        <img
          src={image}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#d1d5db">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span style="font-size:12px;color:#9ca3af;">No Image</span>
              </div>`;
          }}
        />
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-orange-500 transition-colors">
          {productName}
        </h3>

        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
          {category}
          {subCategory ? ` › ${subCategory}` : ''}
        </p>

        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="min-w-0">
            <p className="text-orange-500 font-bold text-base">
              ₹{finalPrice}
              {type === 'Rental' ? '/mo' : ''}
            </p>
            {hasOffer ? (
              <p className="text-xs text-gray-400 line-through">
                ₹{base}
                {type === 'Rental' ? '/mo' : ''}
              </p>
            ) : null}
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              type === 'Rental'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-green-50 text-green-600'
            }`}
          >
            {type}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-400' : 'bg-red-400'}`}
          />
          <span className="text-xs text-gray-500">
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
