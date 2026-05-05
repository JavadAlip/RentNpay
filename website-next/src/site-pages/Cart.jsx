'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  removeFromCart,
  updateQuantity,
  syncCart,
} from '../store/slices/cartSlice';
import { apiGetProductById } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
  Shield,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  BadgePercent,
  AlertCircle,
  Lock,
} from 'lucide-react';
import offerCartIcon from '@/assets/icons/offer-cart.png';

function getDeliveryTimelineLabel(product) {
  const lv = product?.logisticsVerification || {};
  const n = Number(lv.deliveryTimelineValue);
  const unit = String(lv.deliveryTimelineUnit || 'Days').toLowerCase();
  if (!Number.isFinite(n) || n <= 0) return '';
  if (unit === 'hours') {
    return `Delivery in ${n} hour${n === 1 ? '' : 's'}`;
  }
  return `Delivery in ${n} day${n === 1 ? '' : 's'}`;
}

const Cart = () => {
  const { items } = useSelector((s) => s.cart);
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [isHydrated, setIsHydrated] = useState(false);

  const { pushToast } = useToast();
  const isRentalItem = (item) =>
    String(item?.productType || 'Rental') === 'Rental';

  const stockMapKey = useMemo(
    () =>
      items
        .map((i) => i.productId)
        .sort()
        .join('_'),
    [items],
  );
  const [stockByProductId, setStockByProductId] = useState({});
  const [deliveryByProductId, setDeliveryByProductId] = useState({});
  const [isCareProtectionEnabled, setIsCareProtectionEnabled] = useState(true);

  const total = useMemo(() => {
    return items.reduce((sum, i) => {
      const qty = Number(i.quantity || 0);
      const unitPrice = Number(i.pricePerDay || 0);
      if (isRentalItem(i)) {
        // Saved rental tier price is already the full selected tenure
        // (day-wise and month-wise), so quantity alone should scale it.
        return sum + unitPrice * qty;
      }
      return sum + unitPrice * qty;
    }, 0);
  }, [items]);

  const refundableDepositTotal = useMemo(() => {
    return items.reduce((sum, i) => {
      if (!isRentalItem(i)) return sum;
      const deposit = Number(i.refundableDeposit || 0);
      return sum + deposit * Number(i.quantity || 0);
    }, 0);
  }, [items]);

  const hasRentalItems = useMemo(
    () => items.some((i) => isRentalItem(i)),
    [items],
  );

  const primaryRentalItem = useMemo(() => {
    return items.find((i) => isRentalItem(i)) || null;
  }, [items]);

  const getRentalTenureLabel = (item) => {
    const n = Number(item?.rentalMonths || 1);
    return String(item?.tenureUnit || 'month') === 'day'
      ? `${n} Day${n === 1 ? '' : 's'}`
      : `${n} Month${n === 1 ? '' : 's'}`;
  };

  const getRentalPriceLabel = (item) => {
    const n = Number(item?.rentalMonths || 1);
    return String(item?.tenureUnit || 'month') === 'day'
      ? `Daily Rent `
      : `Monthly Rent  `;
  };

  const deliveryFee = useMemo(() => {
    return items.length ? 99 : 0;
  }, [items.length]);

  const gst = useMemo(() => {
    return Math.round(total * 0.06);
  }, [total]);

  // const careProtection = useMemo(() => {
  //   return items.length ? 30 : 0;
  // }, [items.length]);
  const careProtection = useMemo(() => {
    if (!isCareProtectionEnabled) return 0;
    return items.length ? 30 : 0;
  }, [items.length, isCareProtectionEnabled]);

  const totalPayToday = useMemo(() => {
    return total + refundableDepositTotal + deliveryFee + gst + careProtection;
  }, [total, refundableDepositTotal, deliveryFee, gst, careProtection]);

  const imgSrc = (src) => {
    if (!src) return 'https://via.placeholder.com/100?text=No+Image';
    return src.startsWith('http')
      ? src
      : (process.env.NEXT_PUBLIC_API_URL || '') + src;
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    dispatch(syncCart());
  }, [dispatch, user, isAuthenticated, isHydrated]);

  useEffect(() => {
    let cancelled = false;
    const ids = Array.from(new Set(items.map((i) => i.productId))).filter(
      Boolean,
    );
    if (!ids.length) {
      setStockByProductId({});
      setDeliveryByProductId({});
      return;
    }

    Promise.all(
      ids.map((id) =>
        apiGetProductById(id)
          .then((res) => ({
            id,
            stock:
              res.data?.product?.stock != null
                ? Number(res.data.product.stock)
                : 0,
            deliveryLabel: getDeliveryTimelineLabel(res.data?.product),
          }))
          .catch(() => ({ id, stock: 0, deliveryLabel: '' })),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      const nextStock = {};
      const nextDelivery = {};
      pairs.forEach((p) => {
        nextStock[p.id] = p.stock;
        nextDelivery[p.id] = p.deliveryLabel;
      });
      setStockByProductId(nextStock);
      setDeliveryByProductId(nextDelivery);
    });

    return () => {
      cancelled = true;
    };
  }, [stockMapKey]);

  const getStockAndCheck = async (productId, nextQty) => {
    const id = productId;
    const res = await apiGetProductById(id);
    const stock = res.data?.product?.stock ?? stockByProductId[id] ?? 0;
    return {
      ok: Number(nextQty) <= Number(stock || 0),
      stock: Number(stock || 0),
    };
  };

  if (!isHydrated) {
    return <div className="max-w-7xl mx-auto px-4 py-8" />;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-black mb-4">
          Your cart is empty
        </h1>
        <Link
          href="/products"
          className="text-primary font-medium hover:underline"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-black flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} item{items.length > 1 ? 's' : ''} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-4">
            {hasRentalItems && primaryRentalItem ? (
              <div className="rounded-2xl border-2 border-[#3B82F6] bg-[#EFF6FF] px-5 py-4">
                <p className="font-bold text-xl text-black flex items-center gap-2">
                  {getRentalTenureLabel(primaryRentalItem)} Lock-IN Period
                  <Shield className="w-5 h-5 text-gray-500" />
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  You got a {getRentalTenureLabel(primaryRentalItem)} of lock’in
                  , Ending early means paying for the rest.
                </p>
              </div>
            ) : null}

            {items.map((item) => (
              <div
                key={item.productId}
                className="p-4 bg-white border border-gray-200 rounded-2xl"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <img
                      src={imgSrc(item.image)}
                      alt=""
                      className="w-full sm:w-28 h-28 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100';
                      }}
                    />
                    <span
                      className={`absolute top-2 left-2 text-[10px] uppercase px-2 py-0.5 rounded-full text-white ${
                        isRentalItem(item) ? 'bg-orange-500' : 'bg-blue-600'
                      }`}
                    >
                      {isRentalItem(item) ? 'Rental' : 'Buy'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <p className="font-semibold text-2xl text-black truncate">
                        {item.title}
                      </p>
                      {isRentalItem(item) ? (
                        <div className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                          {getRentalTenureLabel(item)}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md">
                      <div className="rounded-xl border border-[#FFD6A8] bg-white px-3 py-2">
                        <p className="text-3xl text-center font-semibold text-[#F97316]">
                          ₹{item.pricePerDay}
                        </p>
                        <p className="text-xs text-center text-gray-500">
                          {isRentalItem(item)
                            ? getRentalPriceLabel(item)
                            : 'Sale Price'}
                        </p>
                      </div>
                      {isRentalItem(item) ? (
                        <div className="rounded-xl border border-[#FFD6A8] bg-white px-3 py-2">
                          <p className="text-3xl text-center font-semibold text-[#F97316]">
                            ₹{Number(item.refundableDeposit || 0)}
                          </p>
                          <p className="text-xs text-center text-gray-500">
                            Deposit
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {deliveryByProductId[item.productId] ||
                        'Delivery in 2-3 days'}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 mt-2"></p>
                      {/* 
                      <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            dispatch(removeFromCart(item.productId))
                          }
                          className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity - 1,
                              }),
                            )
                          }
                          className="w-9 h-9 inline-flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={async () => {
                            const productId = item.productId;
                            const nextQty = item.quantity + 1;
                            const { ok, stock } = await getStockAndCheck(
                              productId,
                              nextQty,
                            );
                            if (!ok) {
                              pushToast(
                                `Only ${stock} available in stock for this product.`,
                                'error',
                              );
                              return;
                            }
                            dispatch(
                              updateQuantity({
                                productId,
                                quantity: nextQty,
                              }),
                            );
                          }}
                          className="w-9 h-9 inline-flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div> */}
                      <div className="inline-flex items-center border-2 border-[#D1D5DC] rounded-lg overflow-hidden">
                        {/* Trash */}
                        <button
                          onClick={() =>
                            dispatch(removeFromCart(item.productId))
                          }
                          className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-gray-50 border-r border-gray-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Minus */}
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity - 1,
                              }),
                            )
                          }
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 "
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        {/* Quantity */}
                        <span className="w-10 text-center text-sm ">
                          {item.quantity}
                        </span>

                        {/* Plus */}
                        <button
                          onClick={async () => {
                            const productId = item.productId;
                            const nextQty = item.quantity + 1;
                            const { ok, stock } = await getStockAndCheck(
                              productId,
                              nextQty,
                            );

                            if (!ok) {
                              pushToast(
                                `Only ${stock} available in stock for this product.`,
                                'error',
                              );
                              return;
                            }

                            dispatch(
                              updateQuantity({
                                productId,
                                quantity: nextQty,
                              }),
                            );
                          }}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* <p className="text-xs text-gray-500 mt-2">
                      Available stock: {stockByProductId[item.productId] ?? '—'}
                    </p> */}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="xl:col-span-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-md p-5 sticky top-24">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Items Total</span>
                  <span className="font-medium">₹{total.toFixed(0)}</span>
                </div>
                {hasRentalItems ? (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Base Rental Cost</span>
                    <span className="font-medium">₹{total.toFixed(0)}</span>
                  </div>
                ) : null}
                {hasRentalItems ? (
                  <div className="flex items-center justify-between">
                    {/* <span className="text-gray-600">Refundable Deposits</span> */}
                    <span className="text-gray-600 flex items-center gap-1">
                      Refundable Deposits
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    </span>
                    <span className="font-medium">
                      ₹{refundableDepositTotal.toFixed(0)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">₹{deliveryFee}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-gray-600">GST</span>
                  <span className="font-medium">₹{gst}</span>
                </div>
              </div>

              {/* {hasRentalItems ? (
                <div className="mt-4 rounded-xl border-2 border-[#BEDBFF] bg-blue-50 px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#2563EB]" />
                      <span>Rentnpay Care Protection</span>
                      <AlertCircle className="w-4 h-4 text-black" />
                    </p>
                    <p className="text-xs text-gray-500">
                      Damage protection & priority support
                    </p>
                  </div>
                  <span className="font-semibold text-blue-700">
                    ₹{careProtection}
                  </span>
                </div>
              ) : null} */}
              {hasRentalItems && isCareProtectionEnabled ? (
                <div className="mt-4">
                  {/* Box */}
                  <div className="rounded-xl border-2 border-[#BEDBFF] bg-blue-50 px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-black flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#2563EB]" />
                        <span>Rentnpay Care Protection</span>
                        <AlertCircle className="w-4 h-4 text-black" />
                      </p>
                      <p className="text-xs text-gray-500">
                        Damage protection & priority support
                      </p>
                    </div>

                    <span className="font-semibold text-blue-700 ml-4">
                      ₹{careProtection}
                    </span>
                  </div>

                  {/* Bottom right text */}
                  <div className="flex justify-end mt-1">
                    {/* <button className="text-xs text-gray-500">
                      Don’t Want? <span className="text-blue-600">Remove</span>
                    </button> */}
                    <button
                      onClick={() => setIsCareProtectionEnabled(false)}
                      className="text-xs text-gray-500"
                    >
                      Don’t Want? <span className="text-blue-600">Remove</span>
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 rounded-xl bg-blue-50 px-3 py-3 flex items-center justify-between">
                <span className="font-semibold text-black">
                  Total to Pay Today
                </span>
                <span className="text-4xl font-bold text-blue-700">
                  ₹{totalPayToday.toFixed(0)}
                </span>
              </div>

              <div className="mt-5">
                {/* <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <BadgePercent className="w-4 h-4" />
                  Rental Offers and Discounts
                </p> */}
                <p className="font-semibold text-black flex items-center gap-2">
                  <img
                    src={offerCartIcon.src}
                    alt="Offers"
                    className="w-5 h-5 shrink-0"
                  />
                  Rental Offers and Discounts
                </p>
                <div className="mt-3 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {[1, 2].map((x) => (
                      <div
                        key={x}
                        className="w-56 rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <p className="text-xs text-orange-600 font-medium">
                          18% Discount Upto ₹ 2000
                        </p>
                        <div className="mt-2 h-1.5 rounded-full bg-orange-200">
                          <div className="h-1.5 rounded-full bg-orange-500 w-2/3" />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-orange-300 text-orange-600">
                            MAX SAVINGS
                          </span>
                          <span className="text-xs font-semibold text-orange-600">
                            APPLY
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2">Have a Coupon?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Code"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                  <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                    Apply
                  </button>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-5 block w-full py-3 bg-[#2563EB] text-white text-center font-medium rounded-xl hover:bg-blue-700"
              >
                Proceed to Checkout
              </Link>

              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p className="flex items-center justify-center gap-1 ">
                  <Lock className="w-3 h-3 text-[#10B981]" />
                  100% Secure Payments
                </p>
                <p className="flex items-center justify-center gap-1 ">
                  <Shield className="w-3 h-3 text-[#2563EB]" />
                  Deposits are Refundable
                </p>
                {/* <p>◎ Deposits are Refundable</p> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
