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
} from 'lucide-react';

const Cart = () => {
  const { items } = useSelector((s) => s.cart);
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const { pushToast } = useToast();
  const isRentalItem = (item) => String(item?.productType || 'Rental') === 'Rental';

  const stockMapKey = useMemo(
    () => items.map((i) => i.productId).sort().join('_'),
    [items],
  );
  const [stockByProductId, setStockByProductId] = useState({});

  const total = useMemo(() => {
    return items.reduce((sum, i) => {
      const qty = Number(i.quantity || 0);
      const unitPrice = Number(i.pricePerDay || 0);
      if (isRentalItem(i)) {
        const rentalMonths = Number(i.rentalMonths || 1);
        return sum + unitPrice * rentalMonths * qty;
      }
      return sum + unitPrice * qty;
    }, 0);
  }, [items]);

  const refundableDepositTotal = useMemo(() => {
    return items.reduce((sum, i) => {
      if (!isRentalItem(i)) return sum;
      const deposit = Number(i.refundableDeposit || 1000);
      return sum + deposit * Number(i.quantity || 0);
    }, 0);
  }, [items]);

  const hasRentalItems = useMemo(
    () => items.some((i) => isRentalItem(i)),
    [items],
  );

  const deliveryFee = useMemo(() => {
    return items.length ? 99 : 0;
  }, [items.length]);

  const gst = useMemo(() => {
    return Math.round(total * 0.06);
  }, [total]);

  const careProtection = useMemo(() => {
    return items.length ? 30 : 0;
  }, [items.length]);

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
    dispatch(syncCart());
  }, [dispatch, user, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    const ids = Array.from(new Set(items.map((i) => i.productId))).filter(Boolean);
    if (!ids.length) {
      setStockByProductId({});
      return;
    }

    Promise.all(
      ids.map((id) =>
        apiGetProductById(id)
          .then((res) => ({
            id,
            stock:
              res.data?.product?.stock != null ? Number(res.data.product.stock) : 0,
          }))
          .catch(() => ({ id, stock: 0 })),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      const next = {};
      pairs.forEach((p) => {
        next[p.id] = p.stock;
      });
      setStockByProductId(next);
    });

    return () => {
      cancelled = true;
    };
  }, [stockMapKey]);

  const getStockAndCheck = async (productId, nextQty) => {
    const id = productId;
    const res = await apiGetProductById(id);
    const stock = res.data?.product?.stock ?? stockByProductId[id] ?? 0;
    return { ok: Number(nextQty) <= Number(stock || 0), stock: Number(stock || 0) };
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
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
          <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} item{items.length > 1 ? 's' : ''} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-4">
            {hasRentalItems ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 px-5 py-4">
              <p className="font-semibold text-2xl text-gray-900 flex items-center gap-2">
                3 Months Lock-IN Period
                <Shield className="w-5 h-5 text-gray-500" />
              </p>
              <p className="text-sm text-gray-600 mt-1">
                You got a 3 months lock-in, ending early means paying for the rest
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
                    <p className="font-semibold text-2xl text-gray-900 truncate">
                      {item.title}
                    </p>
                    {isRentalItem(item) ? (
                      <div className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                        {item.rentalMonths || 1} Months
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-3xl font-semibold text-amber-700">
                        ₹{item.pricePerDay}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isRentalItem(item) ? 'Monthly Rent' : 'Sale Price'}
                      </p>
                    </div>
                    {isRentalItem(item) ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-3xl font-semibold text-gray-900">
                          ₹{item.refundableDeposit || 1000}
                        </p>
                        <p className="text-xs text-gray-500">Deposit</p>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">Delivery in 2-3 days</p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => dispatch(removeFromCart(item.productId))}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>

                    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
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
                      <span className="w-10 text-center text-sm">{item.quantity}</span>
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
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Available stock: {stockByProductId[item.productId] ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>

          <div className="xl:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
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
                    <span className="text-gray-600">Refundable Deposits</span>
                    <span className="font-medium">₹{refundableDepositTotal.toFixed(0)}</span>
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

              {hasRentalItems ? (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Rentnpay Care Protection
                  </p>
                  <p className="text-xs text-gray-500">
                    Damage protection & priority support
                  </p>
                </div>
                <span className="font-semibold text-blue-700">₹{careProtection}</span>
              </div>
              ) : null}

              <div className="mt-4 rounded-xl bg-blue-50 px-3 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total to Pay Today</span>
                <span className="text-4xl font-bold text-blue-700">
                  ₹{totalPayToday.toFixed(0)}
                </span>
              </div>

              <div className="mt-5">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <BadgePercent className="w-4 h-4" />
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
                          <span className="text-xs font-semibold text-orange-600">APPLY</span>
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
                className="mt-5 block w-full py-3 bg-blue-600 text-white text-center font-medium rounded-xl hover:bg-blue-700"
              >
                Proceed to Checkout
              </Link>

              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>🔒 100% Secure Payments</p>
                <p>◎ Deposits are Refundable</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
