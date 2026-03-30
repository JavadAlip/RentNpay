// 'use client';

// import React, { useState } from 'react';

// const RentPrdctMain = () => {
//   const [selectedPlan, setSelectedPlan] = useState('6');

//   const plans = [
//     { month: '3', price: 799 },
//     { month: '6', price: 699 },
//     { month: '12', price: 499 },
//   ];

//   const images = [
//     'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
//     'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
//     'https://images.unsplash.com/photo-1616628182509-6c6c4c4f8d2d',
//     'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
//   ];

//   const [mainImg, setMainImg] = useState(images[0]);

//   const plan = plans.find((p) => p.month === selectedPlan);

//   return (
//     <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
//       {/* LEFT SIDE - PRODUCT IMAGE */}
//       <div className="min-w-0">
//         <div className="rounded-lg sm:rounded-xl overflow-hidden border">
//           <img
//             src={mainImg}
//             alt="sofa"
//             className="w-full h-56 sm:h-72 md:h-80 lg:h-[420px] object-cover"
//           />
//         </div>

//         {/* Thumbnails */}
//         <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4 overflow-x-auto pb-1">
//           {images.map((img, i) => (
//             <img
//               key={i}
//               src={img}
//               onClick={() => setMainImg(img)}
//               className="w-16 h-14 sm:w-24 sm:h-20 object-cover rounded-lg border cursor-pointer hover:border-orange-500 shrink-0"
//             />
//           ))}
//         </div>
//       </div>

//       {/* RIGHT SIDE */}
//       <div className="min-w-0">
//         <p className="text-[#4A5565] text-xs sm:text-sm truncate">
//           Home &gt; Furniture &gt; Living Room &gt; Sofas
//         </p>
//         <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6 lg:gap-20 gap-2 mt-2">
//           <h1 className="text-xl sm:text-2xl font-semibold">
//             3-Seater Fabric Sofa - Grey
//           </h1>

//           <div className="flex items-center gap-2 sm:gap-3">
//             <span className="bg-green-500 text-white text-xs sm:text-sm px-2 py-0.5 sm:py-1 rounded">
//               4.8 ★
//             </span>
//             <span className="text-gray-500 text-xs sm:text-sm">
//               124 Ratings
//             </span>
//           </div>
//         </div>

//         {/* Rental Tenure */}
//         <div className="mt-4 sm:mt-6 border rounded-lg sm:rounded-xl p-3 sm:p-5">
//           <p className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
//             Select Rental Tenure
//           </p>

//           <div className="grid grid-cols-3 gap-2 sm:gap-4">
//             {plans.map((p) => (
//               <div
//                 key={p.month}
//                 onClick={() => setSelectedPlan(p.month)}
//                 className={`cursor-pointer border rounded-lg p-2 sm:p-3 text-center ${
//                   selectedPlan === p.month
//                     ? 'bg-orange-500 text-white'
//                     : 'bg-white'
//                 }`}
//               >
//                 <p className="text-xs sm:text-sm">{p.month} Months</p>
//                 <p className="font-semibold text-sm sm:text-base">
//                   ₹{p.price}/mo
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Price Box */}
//         <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4">
//           <div className="flex justify-between text-sm sm:text-base">
//             <span>Monthly Rent</span>
//             <span className="text-lg sm:text-xl font-bold">
//               ₹{plan.price}/mo
//               <span className="text-[#4A5565] line-through text-xs sm:text-sm ml-2">
//                 799
//               </span>
//             </span>
//           </div>

//           <div className="flex justify-between text-xs sm:text-sm text-gray-600">
//             <span>Refundable Deposit</span>
//             <span className="text-green-600 font-medium text-sm sm:text-base">
//               ₹1,000
//             </span>
//           </div>
//           <div className="flex justify-between items-center bg-white border border-orange-300 p-3 sm:p-4 rounded-lg mt-3 sm:mt-4 gap-2">
//             <div className="min-w-0">
//               <span className="font-semibold text-sm sm:text-base">
//                 Total Payable Now
//               </span>
//               <p className="text-[10px] sm:text-xs text-gray-500 font-normal">
//                 (1st Month Rent + Deposit)
//               </p>
//             </div>
//             <span className="text-orange-500 font-medium text-sm sm:text-base shrink-0">
//               ₹{plan.price + 1000}
//             </span>
//           </div>
//         </div>

//         {/* Delivery Box */}
//         <div className="bg-[#BEDBFF] mt-4 sm:mt-5 border-2 border-blue-300 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
//           Delivered & Installed by Tomorrow, 2PM
//           <p className="text-gray-500 mt-0.5">
//             Free delivery and setup included
//           </p>
//         </div>

//         {/* Buttons */}
//         <button className="w-full bg-orange-500 text-white py-2.5 sm:py-3 rounded-lg mt-4 sm:mt-6 font-medium text-sm sm:text-base hover:bg-orange-600">
//           Rent Now
//         </button>

//         <button className="w-full border border-orange-500 text-orange-500 py-2.5 sm:py-3 rounded-lg mt-3 sm:mt-4 font-medium text-sm sm:text-base hover:bg-orange-50">
//           Add to Cart
//         </button>
//         <div className="bg-blue-50 mt-4 sm:mt-5 p-3 sm:p-4 text-center rounded-lg text-xs sm:text-sm">
//           <p className="text-gray-500">
//             Total rental cost for 6 months:{' '}
//             <span className="font-semibold text-black">₹4,194</span>{' '}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RentPrdctMain;

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/store/slices/cartSlice';
import {
  useAuthModal,
  AUTH_REDIRECT_SESSION_KEY,
} from '@/contexts/AuthModalContext';
import { apiGetProductById } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

// ─── Static fallback data (shown when API field is missing) ──────────────────
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
  'https://images.unsplash.com/photo-1616628182509-6c6c4c4f8d2d',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
];

const STATIC_PLANS = [
  {
    id: 'm-3',
    tenureLabel: '3 Months',
    rentalMonths: 3,
    rawDays: 0,
    periodUnit: 'month',
    price: 799,
    label: '',
    priceSuffix: '/mo',
  },
  {
    id: 'm-6',
    tenureLabel: '6 Months',
    rentalMonths: 6,
    rawDays: 0,
    periodUnit: 'month',
    price: 699,
    label: '',
    priceSuffix: '/mo',
  },
  {
    id: 'm-12',
    tenureLabel: '12 Months',
    rentalMonths: 12,
    rawDays: 0,
    periodUnit: 'month',
    price: 499,
    label: '',
    priceSuffix: '/mo',
  },
];

// ─── Parse price string like "1599/month" or "20000" → number ───────────────
function parsePrice(raw) {
  if (!raw) return null;
  const num = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? null : num;
}

function tierRentAmount(cfg) {
  const cr = Number(cfg?.customerRent);
  if (Number.isFinite(cr) && cr > 0) return cr;
  const pd = Number(cfg?.pricePerDay);
  if (Number.isFinite(pd) && pd > 0) return pd;
  return 0;
}

// ─── Build 3 rental plans from a base price (fallback) ─────────────────────
function buildPlans(basePrice) {
  return [
    {
      id: 'm-3',
      tenureLabel: '3 Months',
      rentalMonths: 3,
      rawDays: 0,
      periodUnit: 'month',
      price: Math.round(basePrice * 1.15),
      label: '',
      priceSuffix: '/mo',
    },
    {
      id: 'm-6',
      tenureLabel: '6 Months',
      rentalMonths: 6,
      rawDays: 0,
      periodUnit: 'month',
      price: basePrice,
      label: '',
      priceSuffix: '/mo',
    },
    {
      id: 'm-12',
      tenureLabel: '12 Months',
      rentalMonths: 12,
      rawDays: 0,
      periodUnit: 'month',
      price: Math.round(basePrice * 0.75),
      label: '',
      priceSuffix: '/mo',
    },
  ];
}

/** Maps vendor `rentalConfigurations` (customerRent + months/days) → UI plans. */
function normalizeRentalPlansFromProduct(product) {
  const arr = Array.isArray(product?.rentalConfigurations)
    ? product.rentalConfigurations
    : [];
  const out = [];
  arr.forEach((cfg, idx) => {
    const periodUnit = cfg?.periodUnit === 'day' ? 'day' : 'month';
    const months = Number(cfg?.months) || 0;
    const days = Number(cfg?.days) || 0;
    const price = tierRentAmount(cfg);
    if (!Number.isFinite(price) || price <= 0) return;

    const id =
      periodUnit === 'day' && days > 0
        ? `d-${days}-${idx}`
        : months > 0
          ? `m-${months}-${idx}`
          : `tier-${idx}`;

    const tenureLabel =
      periodUnit === 'day' && days > 0
        ? `${days} Days`
        : months > 0
          ? `${months} Months`
          : `Option ${idx + 1}`;

    out.push({
      id,
      tenureLabel,
      rentalMonths: months > 0 ? months : Math.max(1, Math.ceil(days / 30)),
      rawDays: days,
      periodUnit,
      price,
      label: String(cfg?.label || '').trim(),
      priceSuffix: periodUnit === 'day' ? '/day' : '/mo',
    });
  });
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
const RentPrdctMain = ({ product, offer }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { openAuth } = useAuthModal();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const { items } = useSelector((s) => s.cart);
  const { pushToast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // ── Real data first, static fallback second ──────────────────────────────
  const productName = product?.productName || 'Rental product';
  const category = product?.category || '—';
  const subCategory = product?.subCategory || '—';

  const vendorDisplayName = useMemo(() => {
    const v = product?.vendorId;
    if (v && typeof v === 'object' && String(v.fullName || '').trim()) {
      return String(v.fullName).trim();
    }
    const owner = String(
      product?.logisticsVerification?.inventoryOwnerName || '',
    ).trim();
    if (owner) return owner;
    return 'Verified partner';
  }, [product?.vendorId, product?.logisticsVerification?.inventoryOwnerName]);

  // Images: use vendor uploaded images[] first, fallback to image field and static samples.
  const images = useMemo(() => {
    const fromDb = Array.isArray(product?.images)
      ? product.images.filter(Boolean)
      : [];
    if (fromDb.length > 0) return fromDb.slice(0, 5);
    if (product?.image) return [product.image, ...FALLBACK_IMAGES.slice(0, 3)];
    return FALLBACK_IMAGES;
  }, [product?.images, product?.image]);

  const [mainImg, setMainImg] = useState(images[0]);
  useEffect(() => {
    setMainImg(images[0]);
  }, [images]);

  const plans = useMemo(() => {
    const fromVendor = normalizeRentalPlansFromProduct(product);
    if (fromVendor.length) return fromVendor;
    const realPrice = parsePrice(product?.price);
    if (realPrice) return buildPlans(realPrice);
    return STATIC_PLANS;
  }, [product]);

  const defaultPlanId = plans[0]?.id || '';
  useEffect(() => {
    setSelectedPlanId((prev) =>
      plans.some((p) => p.id === prev) ? prev : defaultPlanId,
    );
  }, [defaultPlanId, plans]);

  const plan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || plans[0],
    [plans, selectedPlanId],
  );

  const discountPercent = Number(offer?.discountPercent || 0);
  const hasOffer = discountPercent > 0;
  const effectivePlanPrice = useMemo(() => {
    if (!plan) return 0;
    return hasOffer
      ? Math.max(
          0,
          Math.round(plan.price - (plan.price * discountPercent) / 100),
        )
      : plan.price;
  }, [plan, hasOffer, discountPercent]);

  const strikePrice = useMemo(() => {
    if (!plans.length) return 0;
    return Math.max(...plans.map((p) => p.price));
  }, [plans]);

  const rentLineLabel =
    plan?.periodUnit === 'day' ? 'Rental rate' : 'Monthly rent';

  const [currentStock, setCurrentStock] = useState(
    typeof product?.stock === 'number' ? product.stock : 0,
  );

  useEffect(() => {
    let isMounted = true;
    const id = product?._id;
    if (!id) return;

    // Refresh stock dynamically when opening product details.
    apiGetProductById(id)
      .then((res) => {
        const stock = res.data?.product?.stock;
        if (!isMounted) return;
        setCurrentStock(typeof stock === 'number' ? stock : 0);
      })
      .catch(() => {
        if (!isMounted) return;
        setCurrentStock(typeof product?.stock === 'number' ? product.stock : 0);
      });

    return () => {
      isMounted = false;
    };
  }, [product?._id]);

  /** Cart / checkout tenure: months for month-plans; day count for day-plans. */
  const activeRentalMonths = useMemo(() => {
    if (!plan) return 1;
    if (plan.periodUnit === 'day' && plan.rawDays > 0) return plan.rawDays;
    return plan.rentalMonths || 1;
  }, [plan]);

  const totalRentalForTenure = useMemo(() => {
    if (!plan) return 0;
    if (plan.periodUnit === 'day' && plan.rawDays > 0) {
      return effectivePlanPrice * plan.rawDays;
    }
    return effectivePlanPrice * (plan.rentalMonths || 1);
  }, [plan, effectivePlanPrice]);

  const tenureSummaryText = useMemo(() => {
    if (!plan) return '';
    if (plan.periodUnit === 'day' && plan.rawDays > 0) {
      return `${plan.rawDays} days`;
    }
    return `${plan.rentalMonths || 1} months`;
  }, [plan]);

  const handleAddToCart = () => {
    (async () => {
      const productId = product?._id;
      if (!productId) return;

      if (items?.length) {
        const cartRentalMonths = items?.[0]?.rentalMonths;
        if (cartRentalMonths && cartRentalMonths !== activeRentalMonths) {
          pushToast(
            'Please clear cart to choose a different rental duration.',
            'warning',
          );
          return;
        }
      }

      const existingQty =
        items.find((i) => i.productId === productId)?.quantity || 0;
      const res = await apiGetProductById(productId);
      const stock = res.data?.product?.stock ?? currentStock ?? 0;

      if (!stock || stock <= 0) {
        pushToast('Sorry, this product is out of stock.', 'error');
        return;
      }

      if (existingQty + 1 > stock) {
        pushToast(
          `Only ${stock} available in stock for this product.`,
          'error',
        );
        return;
      }

      dispatch(
        addToCart({
          productId,
          quantity: 1,
          rentalMonths: activeRentalMonths,
          pricePerDay: effectivePlanPrice,
          title: productName,
          image: images?.[0] || '',
        }),
      );

      if (!isAuthenticated) {
        sessionStorage.setItem(AUTH_REDIRECT_SESSION_KEY, '/cart');
        openAuth('login');
      }

      router.push('/cart');
    })();
  };

  const handleRentNow = () => {
    (async () => {
      const productId = product?._id;
      if (!productId) return;

      if (items?.length) {
        const cartRentalMonths = items?.[0]?.rentalMonths;
        if (cartRentalMonths && cartRentalMonths !== activeRentalMonths) {
          pushToast(
            'Please clear cart to choose a different rental duration.',
            'warning',
          );
          return;
        }
      }

      const existingQty =
        items.find((i) => i.productId === productId)?.quantity || 0;
      const res = await apiGetProductById(productId);
      const stock = res.data?.product?.stock ?? currentStock ?? 0;

      if (!stock || stock <= 0) {
        pushToast('Sorry, this product is out of stock.', 'error');
        return;
      }

      if (existingQty + 1 > stock) {
        pushToast(
          `Only ${stock} available in stock for this product.`,
          'error',
        );
        return;
      }

      dispatch(
        addToCart({
          productId,
          quantity: 1,
          rentalMonths: activeRentalMonths,
          pricePerDay: effectivePlanPrice,
          title: productName,
          image: images?.[0] || '',
        }),
      );

      if (!isAuthenticated) {
        sessionStorage.setItem(AUTH_REDIRECT_SESSION_KEY, '/checkout');
        openAuth('login');
      }

      router.push('/checkout');
    })();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
      {/* ── LEFT: Images ──────────────────────────────────────────────────── */}
      <div className="min-w-0">
        <div className="rounded-lg sm:rounded-xl overflow-hidden border">
          <img
            src={mainImg}
            alt={productName}
            className="w-full h-56 sm:h-72 md:h-80 lg:h-[420px] object-cover"
          />
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`view-${i + 1}`}
              onClick={() => setMainImg(img)}
              className={`w-16 h-14 sm:w-24 sm:h-20 object-cover rounded-lg border cursor-pointer shrink-0 transition-all
                ${
                  mainImg === img
                    ? 'border-orange-500 ring-1 ring-orange-400'
                    : 'hover:border-orange-400'
                }`}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT: Details ────────────────────────────────────────────────── */}
      <div className="min-w-0">
        {/* Breadcrumb */}
        <p className="text-[#4A5565] text-xs sm:text-sm truncate">
          Home &gt; {category} &gt; {subCategory}
        </p>

        {/* Title + Rating */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6 lg:gap-10 gap-2 mt-2">
          <h1 className="text-xl sm:text-2xl font-semibold">{productName}</h1>

          <div className="flex flex-col items-end sm:items-end gap-0.5 shrink-0 text-right">
            <span className="bg-green-500 text-white text-xs sm:text-sm px-2 py-0.5 sm:py-1 rounded">
              4.8 ★
            </span>
            {/* <span
              className="text-gray-500 text-xs sm:text-sm max-w-[10rem] sm:max-w-[14rem] truncate"
              title={vendorDisplayName}
            >
              Listed by {vendorDisplayName}
            </span> */}
          </div>
        </div>
        {hasOffer ? (
          <p className="mt-1 text-sm font-medium text-emerald-600">
            ({discountPercent}% off)
          </p>
        ) : null}

        {/* Stock badge */}
        {Number.isFinite(currentStock) && (
          <span
            className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full
            ${
              currentStock > 0
                ? currentStock <= 3
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
          </span>
        )}

        {/* ── Rental Tenure ── */}
        <div className="mt-4 sm:mt-6 border rounded-lg sm:rounded-xl p-3 sm:p-5">
          <p className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
            Select Rental Tenure
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {plans.map((p) => {
              const displayPrice = hasOffer
                ? Math.max(
                    0,
                    Math.round(p.price - (p.price * discountPercent) / 100),
                  )
                : p.price;
              const selected = selectedPlanId === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`cursor-pointer border rounded-lg p-2 sm:p-3 text-center transition-colors
                  ${
                    selected
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white hover:border-orange-300'
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-tight">
                    {p.tenureLabel}
                  </p>
                  <p className="font-semibold text-sm sm:text-base mt-1">
                    ₹{displayPrice}
                    <span className="text-[10px] sm:text-xs font-normal opacity-90">
                      {p.priceSuffix}
                    </span>
                  </p>
                  {/* {p.label ? (
                    <p className="text-[10px] mt-1 opacity-90 line-clamp-2">{p.label}</p>
                  ) : null} */}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Price Box ── */}
        <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex justify-between text-sm sm:text-base gap-2">
            <span>{rentLineLabel}</span>
            <span className="text-lg sm:text-xl font-bold text-right">
              ₹{effectivePlanPrice}
              <span className="text-sm font-semibold text-gray-700">
                {plan?.priceSuffix || '/mo'}
              </span>
              {plan && hasOffer ? (
                <span className="text-[#4A5565] line-through text-xs sm:text-sm ml-2">
                  ₹{plan.price}
                  {plan.priceSuffix || '/mo'}
                </span>
              ) : plan && strikePrice > plan.price ? (
                <span className="text-[#4A5565] line-through text-xs sm:text-sm ml-2">
                  ₹{strikePrice}
                  {plan.priceSuffix || '/mo'}
                </span>
              ) : null}
            </span>
          </div>

          <div className="flex justify-between text-xs sm:text-sm text-gray-600">
            <span>Refundable Deposit</span>
            <span className="text-green-600 font-medium text-sm sm:text-base">
              ₹{Number(product?.refundableDeposit || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between items-center bg-white border border-orange-300 p-3 sm:p-4 rounded-lg gap-2">
            <div className="min-w-0">
              <span className="font-semibold text-sm sm:text-base">
                Total Payable Now
              </span>
              <p className="text-[10px] sm:text-xs text-gray-500 font-normal">
                (1st Month Rent + Deposit)
              </p>
            </div>
            <span className="text-orange-500 font-medium text-sm sm:text-base shrink-0">
              ₹
              {(
                effectivePlanPrice + Number(product?.refundableDeposit || 0)
              ).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* ── Delivery ── */}
        <div className="bg-[#BEDBFF] mt-4 sm:mt-5 border-2 border-blue-300 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
          {(() => {
            const lv = product?.logisticsVerification || {};
            const n = Number(lv.deliveryTimelineValue);
            const unit = String(
              lv.deliveryTimelineUnit || 'Days',
            ).toLowerCase();
            if (Number.isFinite(n) && n > 0) {
              return (
                <>
                  <span className="font-medium">
                    Estimated delivery: {n}{' '}
                    {unit === 'hours' ? 'hour(s)' : 'day(s)'} after order
                    confirmation
                  </span>
                  <p className="text-gray-600 mt-0.5">
                    {lv.city
                      ? `Service area includes ${lv.city}.`
                      : 'Delivery timeline set by the renter.'}
                  </p>
                </>
              );
            }
            return (
              <>
                <span className="font-medium">Delivery</span>
                <p className="text-gray-600 mt-0.5">
                  Contact the renter after checkout for delivery scheduling.
                </p>
              </>
            );
          })()}
        </div>

        {/* ── CTA Buttons ── */}
        <button
          type="button"
          onClick={handleRentNow}
          disabled={currentStock <= 0}
          className="w-full bg-orange-500 text-white py-2.5 sm:py-3 rounded-lg mt-4 sm:mt-6 font-medium text-sm sm:text-base hover:bg-orange-600 transition-colors"
        >
          Rent Now
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={currentStock <= 0}
          className="w-full border border-orange-500 text-orange-500 py-2.5 sm:py-3 rounded-lg mt-3 sm:mt-4 font-medium text-sm sm:text-base hover:bg-orange-50 transition-colors"
        >
          Add to Cart
        </button>

        {/* Total cost summary */}
        <div className="bg-blue-50 mt-4 sm:mt-5 p-3 sm:p-4 text-center rounded-lg text-xs sm:text-sm">
          <p className="text-gray-500">
            Total rental for {tenureSummaryText}:{' '}
            <span className="font-semibold text-black">
              ₹{totalRentalForTenure.toLocaleString('en-IN')}
            </span>
            {plan?.periodUnit === 'day' ? (
              <span className="block text-[10px] text-gray-400 mt-1">
                ({plan.rawDays} × ₹{effectivePlanPrice}/day)
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RentPrdctMain;
