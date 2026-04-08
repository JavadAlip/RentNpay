'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShieldCheck, Truck, BadgeCheck, Star } from 'lucide-react';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512495039889-52a3b799c9c7?auto=format&fit=crop&w=1200&q=80',
];

function parseSellPrice(product) {
  if (product?.salesConfiguration?.salePrice != null) {
    const n = Number(product.salesConfiguration.salePrice);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const s = String(product?.price || '').replace(/[^\d.]/g, '').trim();
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const BuyPrdctMain = ({ product }) => {
  const router = useRouter();
  const [mainImg, setMainImg] = useState(() => {
    if (Array.isArray(product?.images) && product.images.length) {
      return product.images[0];
    }
    if (product?.image) return product.image;
    return FALLBACK_IMAGES[0];
  });

  const gallery = useMemo(() => {
    const imgs = Array.isArray(product?.images)
      ? product.images.filter(Boolean)
      : [];
    if (imgs.length) return imgs.slice(0, 5);
    if (product?.image) return [product.image, ...FALLBACK_IMAGES.slice(0, 3)];
    return FALLBACK_IMAGES;
  }, [product?.images, product?.image]);

  const conditionLabel = useMemo(() => {
    const raw = String(product?.condition || '').trim();
    if (!raw) return 'Brand New';
    return raw;
  }, [product?.condition]);

  const price = useMemo(() => parseSellPrice(product), [product]);
  const mrp = useMemo(() => {
    if (product?.salesConfiguration?.mrpPrice != null) {
      const n = Number(product.salesConfiguration.mrpPrice);
      if (Number.isFinite(n) && n > 0) return n;
    }
    if (price > 0) return Math.round(price * 1.2);
    return 0;
  }, [product, price]);

  const discountPct =
    price > 0 && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const deliveryText = useMemo(() => {
    const rawValue = product?.logisticsVerification?.deliveryTimelineValue;
    const rawUnit = String(
      product?.logisticsVerification?.deliveryTimelineUnit || 'Days',
    ).trim();
    const n = Number(rawValue);
    if (Number.isFinite(n) && n > 0) {
      const unit = rawUnit || 'Days';
      return `${n} ${unit}`;
    }
    return 'Tomorrow, 4 PM';
  }, [product?.logisticsVerification?.deliveryTimelineValue, product?.logisticsVerification?.deliveryTimelineUnit]);

  const goToCheckout = () => {
    // For now, reuse existing /checkout flow; cart integration can be wired later.
    router.push('/checkout');
  };

  return (
    <section className="w-full bg-gray-50 px-3 sm:px-4 py-5 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4">
          Home <span className="mx-1">›</span> {product?.category || 'Electronics'}{' '}
          <span className="mx-1">›</span> {product?.subCategory || 'Mobiles'}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-5 lg:gap-7">
          {/* Left block */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center rounded-full bg-blue-500 text-white px-3 py-1 text-[10px] sm:text-xs font-semibold">
                {conditionLabel === 'Brand New' ? '+ New Product' : '+ Refurbished'}
              </span>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white">
                <Heart className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="aspect-[1/1] sm:aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
              <img
                src={mainImg}
                alt={product?.productName || 'Product'}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
              {gallery.slice(0, 5).map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMainImg(src)}
                  className={`h-14 sm:h-16 rounded-lg overflow-hidden border ${
                    mainImg === src ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right block */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h1 className="text-2xl sm:text-[32px] leading-tight font-semibold text-gray-900">
                {product?.productName || 'Buy product'}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500 px-2 py-1 text-white text-[11px] font-semibold">
                  <Star className="h-3 w-3 fill-white text-white" />
                  4.8
                </span>
                <span className="text-xs sm:text-sm text-gray-500 underline">
                  124 Ratings
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-100/70 px-4 py-4">
              <div className="flex items-end gap-2 sm:gap-3">
                <span className="text-3xl sm:text-[40px] leading-none font-semibold text-gray-900">
                  ₹{price || 0}
                </span>
                {mrp > price ? (
                  <span className="text-sm text-gray-400 line-through pb-1">₹{mrp}</span>
                ) : null}
                {discountPct > 0 ? (
                  <span className="text-sm sm:text-base font-semibold text-emerald-600 pb-1">
                    {discountPct}% OFF
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 mt-1">inclusive of all taxes</p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white px-4 py-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Why Trust This Product?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <BadgeCheck className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">
                      Condition: <span className="font-medium">{conditionLabel}</span>
                    </p>
                    <p className="text-xs text-gray-500">Quality checked by seller</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">1-Year Brand Warranty</p>
                    <p className="text-xs text-gray-500">Official seller warranty</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Truck className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">
                      Delivered in {deliveryText}
                    </p>
                    <p className="text-xs text-gray-500">Express delivery within city</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={goToCheckout}
              className="w-full rounded-xl bg-orange-500 text-white font-semibold py-3 hover:bg-orange-600"
            >
              Buy Now
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-blue-300 text-blue-700 font-semibold py-3 hover:bg-blue-50"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuyPrdctMain;

