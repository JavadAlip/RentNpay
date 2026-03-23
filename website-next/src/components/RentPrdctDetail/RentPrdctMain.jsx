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

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/store/slices/cartSlice';

// ─── Static fallback data (shown when API field is missing) ──────────────────
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
  'https://images.unsplash.com/photo-1616628182509-6c6c4c4f8d2d',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
];

const STATIC_PLANS = [
  { month: '3', price: 799 },
  { month: '6', price: 699 },
  { month: '12', price: 499 },
];

// ─── Parse price string like "1599/month" or "20000" → number ───────────────
function parsePrice(raw) {
  if (!raw) return null;
  const num = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? null : num;
}

// ─── Build 3 rental plans from a base price ──────────────────────────────────
function buildPlans(basePrice) {
  return [
    { month: '3', price: Math.round(basePrice * 1.15) },
    { month: '6', price: basePrice },
    { month: '12', price: Math.round(basePrice * 0.75) },
  ];
}

// ────────────────────────────────────────────────────────────────────────────
const RentPrdctMain = ({ product }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('6');

  // ── Real data first, static fallback second ──────────────────────────────
  const productName = product?.productName || '3-Seater Fabric Sofa - Grey';
  const category = product?.category || 'Furniture';
  const subCategory = product?.subCategory || 'Sofas';

  // Images: product has one image → use it as first thumb, pad with fallbacks
  const images = product?.image
    ? [product.image, ...FALLBACK_IMAGES.slice(0, 3)]
    : FALLBACK_IMAGES;

  const [mainImg, setMainImg] = useState(images[0]);

  // Plans: derive from real price if available, else use static
  const realPrice = parsePrice(product?.price);
  const plans = realPrice ? buildPlans(realPrice) : STATIC_PLANS;
  const plan = plans.find((p) => p.month === selectedPlan) || plans[1];

  // Highest plan price for strikethrough (3-month = most expensive)
  const strikePrice = plans[0].price;

  const handleAddToCart = () => {
    const productId = product?._id;
    if (!productId) return;

    const months = parseInt(selectedPlan, 10) || 1;
    dispatch(
      addToCart({
        productId,
        quantity: months,
        pricePerDay: plan.price,
        title: productName,
        image: images?.[0] || '',
      }),
    );
    router.push('/cart');
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

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="bg-green-500 text-white text-xs sm:text-sm px-2 py-0.5 sm:py-1 rounded">
              4.8 ★
            </span>
            <span className="text-gray-500 text-xs sm:text-sm">
              124 Ratings
            </span>
          </div>
        </div>

        {/* Stock badge */}
        {product?.status && (
          <span
            className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full
            ${
              product.status === 'Active'
                ? 'bg-green-100 text-green-700'
                : product.status === 'Low Stock'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {product.status === 'Active' ? 'In Stock' : product.status}
          </span>
        )}

        {/* ── Rental Tenure ── */}
        <div className="mt-4 sm:mt-6 border rounded-lg sm:rounded-xl p-3 sm:p-5">
          <p className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
            Select Rental Tenure
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {plans.map((p) => (
              <div
                key={p.month}
                onClick={() => setSelectedPlan(p.month)}
                className={`cursor-pointer border rounded-lg p-2 sm:p-3 text-center transition-colors
                  ${
                    selectedPlan === p.month
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white hover:border-orange-300'
                  }`}
              >
                <p className="text-xs sm:text-sm">{p.month} Months</p>
                <p className="font-semibold text-sm sm:text-base">
                  ₹{p.price}/mo
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Price Box ── */}
        <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex justify-between text-sm sm:text-base">
            <span>Monthly Rent</span>
            <span className="text-lg sm:text-xl font-bold">
              ₹{plan.price}/mo
              {plan.price < strikePrice && (
                <span className="text-[#4A5565] line-through text-xs sm:text-sm ml-2">
                  ₹{strikePrice}
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between text-xs sm:text-sm text-gray-600">
            <span>Refundable Deposit</span>
            <span className="text-green-600 font-medium text-sm sm:text-base">
              ₹1,000
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
              ₹{(plan.price + 1000).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* ── Delivery ── */}
        <div className="bg-[#BEDBFF] mt-4 sm:mt-5 border-2 border-blue-300 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
          Delivered & Installed by Tomorrow, 2PM
          <p className="text-gray-500 mt-0.5">
            Free delivery and setup included
          </p>
        </div>

        {/* ── CTA Buttons ── */}
        <button className="w-full bg-orange-500 text-white py-2.5 sm:py-3 rounded-lg mt-4 sm:mt-6 font-medium text-sm sm:text-base hover:bg-orange-600 transition-colors">
          Rent Now
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full border border-orange-500 text-orange-500 py-2.5 sm:py-3 rounded-lg mt-3 sm:mt-4 font-medium text-sm sm:text-base hover:bg-orange-50 transition-colors"
        >
          Add to Cart
        </button>

        {/* Total cost summary */}
        <div className="bg-blue-50 mt-4 sm:mt-5 p-3 sm:p-4 text-center rounded-lg text-xs sm:text-sm">
          <p className="text-gray-500">
            Total rental cost for {selectedPlan} months:{' '}
            <span className="font-semibold text-black">
              ₹{(plan.price * parseInt(selectedPlan)).toLocaleString('en-IN')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RentPrdctMain;
