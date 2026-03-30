'use client';

import Link from 'next/link';
import { Heart, Bell, ShoppingCart, Star, Truck, MapPin } from 'lucide-react';

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
  const inStock = Number(stock || 0) > 0;
  const rating = (4 + ((productName?.length || 3) % 10) / 10).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all">
      <Link href={`/rent-product-details/${_id}`} className="block">
        <div className="relative h-40 sm:h-44 bg-gray-100 overflow-hidden">
          <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500 text-white">
            Bestseller
          </span>
          <button
            type="button"
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center"
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4 text-gray-500" />
          </button>
          <img
            src={image || 'https://placehold.co/600x400/e5e7eb/6b7280?text=IMG'}
            alt={productName}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span
            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
              inStock
                ? 'bg-blue-50 text-blue-600'
                : 'bg-purple-50 text-purple-600'
            }`}
          >
            {inStock ? (
              <Truck className="w-3 h-3" />
            ) : (
              <MapPin className="w-3 h-3" />
            )}
            {inStock ? '2-4 days' : 'Self-Pickup'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-semibold">
            <Star className="w-3 h-3 fill-white" />
            {rating}
          </span>
        </div>

        <p className="font-medium text-gray-900 line-clamp-1">{productName}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
          {category || 'Product'} {subCategory ? `· ${subCategory}` : ''}
        </p>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-3xl leading-none font-semibold text-gray-900">
              ₹{finalPrice}
              <span className="text-xl">{type === 'Rental' ? '/mo' : ''}</span>
            </p>
            {hasOffer ? (
              <p className="text-xs text-gray-400 line-through mt-0.5">
                ₹{base}
              </p>
            ) : null}
          </div>
          {hasOffer ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-orange-300 text-orange-600 bg-orange-50">
              {discount}% Off
            </span>
          ) : null}
        </div>

        <Link
          href={`/rent-product-details/${_id}`}
          className={`mt-3 w-full inline-flex items-center justify-center gap-1 rounded-xl py-2 text-sm font-medium border ${
            inStock
              ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {inStock ? (
            <ShoppingCart className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          {inStock ? 'Rent Now' : 'Get Notified'}
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
