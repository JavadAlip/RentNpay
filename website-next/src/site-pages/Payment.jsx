'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { apiCreateOrder } from '@/lib/api';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Payment() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { items } = useSelector((s) => s.cart);
  const isPaymentSuccessFlowRef = useRef(false);

  const total = useMemo(() => {
    return items.reduce(
      (sum, i) =>
        sum +
        Number(i.pricePerDay) *
          Number(i.rentalMonths || 1) *
          Number(i.quantity),
      0,
    );
  }, [items]);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [instructions, setInstructions] = useState('');

  const [method, setMethod] = useState('card'); // card | upi
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dummy payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  useEffect(() => {
    // Prevent redirect-to-cart while we are clearing cart as part of a
    // successful "Pay now" flow (we still navigate to payment-successful).
    if (items.length === 0 && !isPaymentSuccessFlowRef.current) {
      router.replace('/cart');
      return;
    }

    const addr = safeParse(
      localStorage.getItem('rentpay_checkout_selectedAddress'),
    );
    setSelectedAddress(addr || null);

    const ins = safeParse(
      localStorage.getItem('rentpay_checkout_instructions'),
    );
    setInstructions(typeof ins === 'string' ? ins : '');
  }, [items.length, router]);

  const handlePay = async () => {
    setError('');
    if (!selectedAddress) {
      setError('Missing delivery address. Go back to checkout.');
      return;
    }
    if (method === 'card') {
      if (!cardNumber.trim() || !expiry.trim() || !cvv.trim() || !nameOnCard.trim()) {
        setError('Please fill card details.');
        return;
      }
    }

    setLoading(true);
    try {
      const rentalDuration = Number(items?.[0]?.rentalMonths || 1);
      const orderRes = await apiCreateOrder({
        products: items.map((i) => ({
          product: i.productId,
          quantity: Number(i.quantity),
          pricePerDay: Number(i.pricePerDay),
        })),
        rentalDuration: rentalDuration,
        address: addressLine,
        phone: selectedAddress.phone,
        name: selectedAddress.fullName,
      });
      const createdOrderId = orderRes?.data?._id || '';
      if (createdOrderId) {
        localStorage.setItem('rentpay_last_order_id', createdOrderId);
      }

      // Dummy success flow (real gateway like Razorpay/Stripe can replace this).
      isPaymentSuccessFlowRef.current = true;
      dispatch(clearCart());
      localStorage.removeItem('rentpay_checkout_selectedAddress');
      localStorage.removeItem('rentpay_checkout_instructions');
      router.push(
        createdOrderId
          ? `/payment-successful?orderId=${encodeURIComponent(createdOrderId)}`
          : '/payment-successful',
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order.');
      setLoading(false);
    }
  };

  const addressLine = selectedAddress
    ? `${selectedAddress.addressLine}${
        selectedAddress.area ? `, ${selectedAddress.area}` : ''
      }${selectedAddress.city ? `, ${selectedAddress.city}` : ''}${
        selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : ''
      }`
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900">Delivery Details</h2>
            {selectedAddress ? (
              <>
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  {selectedAddress.fullName}
                </p>
                <p className="text-sm text-gray-600 mt-1">{addressLine}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Phone: {selectedAddress.phone}
                </p>
                {instructions ? (
                  <p className="text-xs text-gray-500 mt-3">
                    Instructions: {instructions}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                No address selected.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900">Select Payment Mode</h2>

            <div className="mt-4 space-y-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${
                  method === 'upi'
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymode"
                  checked={method === 'upi'}
                  onChange={() => setMethod('upi')}
                />
                <div>
                  <div className="font-medium text-gray-900">UPI</div>
                  <div className="text-xs text-gray-500">
                    Dummy UPI payment (placeholder)
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${
                  method === 'card'
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymode"
                  checked={method === 'card'}
                  onChange={() => setMethod('card')}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    Credit / Debit Card
                  </div>
                  <div className="text-xs text-gray-500">
                    Dummy card payment (placeholder)
                  </div>
                </div>
              </label>
            </div>

            {method === 'card' && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-700 sm:col-span-2">
                  Card Number
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="1234 5678 9012 3456"
                  />
                </label>

                <label className="text-xs font-medium text-gray-700">
                  Expiry (MM/YY)
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="12/25"
                  />
                </label>

                <label className="text-xs font-medium text-gray-700">
                  CVV
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="123"
                  />
                </label>

                <label className="text-xs font-medium text-gray-700 sm:col-span-2">
                  Name on Card
                  <input
                    value={nameOnCard}
                    onChange={(e) => setNameOnCard(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="Rahul Sharma"
                  />
                </label>
              </div>
            )}

            {error ? <p className="text-red-600 text-sm mt-3">{error}</p> : null}
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing payment…' : 'Pay Now'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 h-fit">
          <h2 className="font-semibold text-gray-900">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate">
                  {i.title} × {i.quantity}
                </span>
                <span className="font-medium text-gray-900">
                  ₹{(
                    Number(i.pricePerDay) *
                    Number(i.rentalMonths || 1) *
                    Number(i.quantity)
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-xl font-bold text-orange-500">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

