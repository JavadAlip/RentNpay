'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { apiCreateOrder } from '@/lib/api';
import { Building2, CheckCircle2, CreditCard, Landmark, Smartphone } from 'lucide-react';

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
        (String(i.productType || 'Rental') === 'Rental'
          ? Number(i.pricePerDay) *
            Number(i.rentalMonths || 1) *
            Number(i.quantity)
          : Number(i.pricePerDay) * Number(i.quantity)),
      0,
    );
  }, [items]);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [instructions, setInstructions] = useState('');

  const [method, setMethod] = useState('card'); // card | upi | netbanking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveCardForRentals, setSaveCardForRentals] = useState(false);

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
      const rentalItems = items.filter(
        (i) => String(i.productType || 'Rental') === 'Rental',
      );
      const rentalDuration = Number(rentalItems?.[0]?.rentalMonths || 1);
      const tenureUnit =
        rentalItems?.[0]?.tenureUnit === 'day' ? 'day' : 'month';
      const orderRes = await apiCreateOrder({
        products: items.map((i) => ({
          product: i.productId,
          quantity: Number(i.quantity),
          pricePerDay: Number(i.pricePerDay),
        })),
        rentalDuration: rentalDuration,
        tenureUnit,
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
    <div className="min-h-screen bg-[#eff2f8]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose your preferred payment method
        </p>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700">Select Payment Mode</h2>

          <div className="mt-4 space-y-3">
            <label
              className={`block overflow-hidden rounded-2xl border cursor-pointer transition ${
                method === 'upi'
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3 px-4 py-4">
                <input
                  type="radio"
                  name="paymode"
                  checked={method === 'upi'}
                  onChange={() => setMethod('upi')}
                  className="mt-1"
                />
                <Smartphone className="mt-0.5 h-4 w-4 text-gray-500" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">UPI</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Fastest
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Google Pay, PhonePe, Paytm & more
                  </p>
                </div>
              </div>
            </label>

            <div
              className={`overflow-hidden rounded-2xl border transition ${
                method === 'card'
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
                <input
                  type="radio"
                  name="paymode"
                  checked={method === 'card'}
                  onChange={() => setMethod('card')}
                  className="mt-1"
                />
                <CreditCard className="mt-0.5 h-4 w-4 text-gray-500" />
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">Credit / Debit Card</div>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Visa, Mastercard, RuPay
                  </p>
                </div>
              </label>

              {method === 'card' ? (
                <div className="border-t border-orange-200 bg-white px-4 py-4 sm:px-5">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded border border-gray-200 bg-[#f7f9fc] px-2 py-1 text-[10px] text-gray-600">
                      VISA
                    </span>
                    <span className="rounded border border-gray-200 bg-[#f7f9fc] px-2 py-1 text-[10px] text-gray-600">
                      Mastercard
                    </span>
                    <span className="rounded border border-gray-200 bg-[#f7f9fc] px-2 py-1 text-[10px] text-gray-600">
                      RuPay
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-[11px] font-medium text-gray-600 sm:col-span-2">
                      Card Number
                      <input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                        placeholder="1234 5678 9012 3456"
                      />
                    </label>

                    <label className="text-[11px] font-medium text-gray-600">
                      Expiry (MM/YY)
                      <input
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                        placeholder="12/25"
                      />
                    </label>

                    <label className="text-[11px] font-medium text-gray-600">
                      CVV
                      <input
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                        placeholder="123"
                      />
                    </label>

                    <label className="text-[11px] font-medium text-gray-600 sm:col-span-2">
                      Name on Card
                      <input
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                        placeholder="RAHUL SHARMA"
                      />
                    </label>
                  </div>

                  <label className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-[#f5f9ff] px-3 py-3">
                    <input
                      type="checkbox"
                      checked={saveCardForRentals}
                      onChange={(e) => setSaveCardForRentals(e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        Save this card securely for monthly rent payments
                      </p>
                      <p className="mt-1 text-[10px] text-gray-500">
                        We can use this card for scheduled debits in future rental renewals.
                      </p>
                    </div>
                  </label>
                </div>
              ) : null}
            </div>

            <label
              className={`block overflow-hidden rounded-2xl border cursor-pointer transition ${
                method === 'netbanking'
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3 px-4 py-4">
                <input
                  type="radio"
                  name="paymode"
                  checked={method === 'netbanking'}
                  onChange={() => setMethod('netbanking')}
                  className="mt-1"
                />
                <Landmark className="mt-0.5 h-4 w-4 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">Net Banking</div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        All major banks supported
                      </p>
                    </div>
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </label>
          </div>

          {selectedAddress ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-500">
              Delivering to <span className="font-medium text-gray-700">{selectedAddress.fullName}</span>
              {addressLine ? `, ${addressLine}` : ''}.
              {instructions ? ` Instructions: ${instructions}` : ''}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm border border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Total payable</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                ₹{total.toLocaleString('en-IN')}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? 'Processing payment…' : 'Pay Now'}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

