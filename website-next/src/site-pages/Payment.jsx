'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { apiCreateOrder, apiExtendMyOrderTenure } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  Smartphone,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Payment() {
  const searchParams = useSearchParams();
  const isExtensionMode = searchParams.get('mode') === 'extension';
  const [pendingExtension, setPendingExtension] = useState(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const { items } = useSelector((s) => s.cart);
  const isPaymentSuccessFlowRef = useRef(false);

  const isRentalItem = (item) =>
    String(item?.productType || 'Rental') === 'Rental';

  // Base rental cost: saved tier price is already the full selected tenure
  // (for both day-wise and month-wise rentals).
  const rentalBaseCost = useMemo(() => {
    return items.reduce((sum, i) => {
      if (!isRentalItem(i))
        return sum + Number(i.pricePerDay || 0) * Number(i.quantity || 0);
      return sum + Number(i.pricePerDay || 0) * Number(i.quantity || 0);
    }, 0);
  }, [items]);

  const refundableDepositTotal = useMemo(() => {
    return items.reduce((sum, i) => {
      if (!isRentalItem(i)) return sum;
      const deposit = Number(i.refundableDeposit || 0);
      return sum + deposit * Number(i.quantity || 0);
    }, 0);
  }, [items]);

  const deliveryFee = useMemo(() => (items.length ? 99 : 0), [items.length]);
  const gst = useMemo(
    () => Math.round(rentalBaseCost * 0.06),
    [rentalBaseCost],
  );
  const careProtection = useMemo(() => (items.length ? 30 : 0), [items.length]);

  const extensionTotal = useMemo(() => {
    if (!isExtensionMode || !pendingExtension) return 0;
    return Number(pendingExtension.newUnitRent || 0);
  }, [isExtensionMode, pendingExtension]);

  // const total = useMemo(() => {
  //   return (
  //     rentalBaseCost +
  //     refundableDepositTotal +
  //     deliveryFee +
  //     gst +
  //     careProtection
  //   );
  // }, [
  //   rentalBaseCost,
  //   refundableDepositTotal,
  //   deliveryFee,
  //   gst,
  //   careProtection,
  // ]);

  // Replace the final `total` useMemo with:
  const total = useMemo(() => {
    if (isExtensionMode) return extensionTotal;
    return (
      rentalBaseCost +
      refundableDepositTotal +
      deliveryFee +
      gst +
      careProtection
    );
  }, [
    isExtensionMode,
    extensionTotal,
    rentalBaseCost,
    refundableDepositTotal,
    deliveryFee,
    gst,
    careProtection,
  ]);
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

  // useEffect(() => {
  //   // Prevent redirect-to-cart while we are clearing cart as part of a
  //   // successful "Pay now" flow (we still navigate to payment-successful).
  //   if (items.length === 0 && !isPaymentSuccessFlowRef.current) {
  //     router.replace('/cart');
  //     return;
  //   }

  //   const addr = safeParse(
  //     localStorage.getItem('rentpay_checkout_selectedAddress'),
  //   );
  //   setSelectedAddress(addr || null);

  //   const ins = safeParse(
  //     localStorage.getItem('rentpay_checkout_instructions'),
  //   );

  //   if (isExtensionMode) {
  //     const raw = localStorage.getItem('rentpay_pending_extension');
  //     const ext = raw ? safeParse(raw) : null;
  //     setPendingExtension(ext || null);
  //   }
  //   setInstructions(typeof ins === 'string' ? ins : '');
  // }, [items.length, router]);

  useEffect(() => {
    if (
      items.length === 0 &&
      !isPaymentSuccessFlowRef.current &&
      !isExtensionMode
    ) {
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

    if (isExtensionMode) {
      const raw = localStorage.getItem('rentpay_pending_extension');
      const ext = raw ? safeParse(raw) : null;
      setPendingExtension(ext || null);
    }
  }, [items.length, router, isExtensionMode]);

  const handlePay = async () => {
    // At the TOP of the try block inside handlePay, before the existing rental logic:
    // if (isExtensionMode && pendingExtension) {
    //   const {
    //     orderId,
    //     productId,
    //     extensionUnit,
    //     extensionDuration,
    //     newUnitRent,
    //   } = pendingExtension;
    //   const res = await apiExtendMyOrderTenure(orderId, {
    //     extensionUnit,
    //     extensionDuration,
    //     newUnitRent,
    //     productId,
    //   });
    //   const updated = res.data;
    //   // Patch the order in Redux/local state isn't available here — we re-fetch on /my-rentals
    //   localStorage.removeItem('rentpay_pending_extension');
    //   isPaymentSuccessFlowRef.current = true;
    //   router.push(
    //     `/my-rentals?extensionSuccess=1&orderId=${encodeURIComponent(orderId)}`,
    //   );
    //   return;
    // }

    if (isExtensionMode && pendingExtension) {
      const {
        orderId,
        productId,
        extensionUnit,
        extensionDuration,
        newUnitRent,
      } = pendingExtension;

      await apiExtendMyOrderTenure(orderId, {
        extensionUnit,
        extensionDuration,
        newUnitRent,
        productId,
      });

      localStorage.removeItem('rentpay_pending_extension');

      //  SHOW TOAST HERE
      toast.success('Product tenure extended successfully!', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'light',
      });

      isPaymentSuccessFlowRef.current = true;

      //  Delay redirect so toast is visible
      setTimeout(() => {
        router.push(
          `/my-rentals?extensionSuccess=1&orderId=${encodeURIComponent(orderId)}`,
        );
      }, 2000);

      return;
    }
    // ... existing rental order code continues below unchanged
    setError('');
    if (!selectedAddress) {
      setError('Missing delivery address. Go back to checkout.');
      return;
    }
    if (method === 'card') {
      if (
        !cardNumber.trim() ||
        !expiry.trim() ||
        !cvv.trim() ||
        !nameOnCard.trim()
      ) {
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
          <h2 className="text-sm font-semibold text-gray-700">
            Select Payment Mode
          </h2>

          <div className="mt-4 space-y-3">
            {/* <label
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
            </label> */}
            <label
              className={`block overflow-hidden rounded-2xl border cursor-pointer transition ${
                method === 'upi'
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3 px-4 py-4">
                {/* <input
                  type="radio"
                  name="paymode"
                  checked={method === 'upi'}
                  onChange={() => setMethod('upi')}
                  className="mt-1"
                /> */}
                <input
                  type="radio"
                  name="paymode"
                  checked={method === 'upi'}
                  onChange={() => setMethod('upi')}
                  className="mt-3 w-4 h-4 appearance-none rounded-full border-2 border-gray-300 checked:border-[#F97316] checked:bg-[#F97316] relative"
                  style={{
                    backgroundImage:
                      method === 'upi'
                        ? 'radial-gradient(white 40%, transparent 41%)'
                        : 'none',
                  }}
                />

                {/* Icon (aligned with content) */}
                <span className="w-8 h-8 flex items-center justify-center mt-0.5">
                  <Smartphone className="w-4 h-4 text-gray-600" />
                </span>

                {/* Content */}
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
              {/* <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
                <input
                  type="radio"
                  name="paymode"
                  checked={method === 'card'}
                  onChange={() => setMethod('card')}
                  className="mt-1 w-4 h-4 appearance-none rounded-full border-2 border-gray-300 checked:border-[#F97316] checked:bg-[#F97316] relative"
                  style={{
                    backgroundImage:
                      method === 'card'
                        ? 'radial-gradient(white 40%, transparent 41%)'
                        : 'none',
                  }}
                />
                <CreditCard className="mt-0.5 h-4 w-4 text-gray-500" />
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">
                    Credit / Debit Card
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Visa, Mastercard, RuPay
                  </p>
                </div>
              </label> */}
              <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
                <input
                  type="radio"
                  name="paymode"
                  checked={method === 'card'}
                  onChange={() => setMethod('card')}
                  className="mt-3 w-4 h-4 appearance-none rounded-full border-2 border-gray-300 checked:border-[#F97316] checked:bg-[#F97316] relative"
                  style={{
                    backgroundImage:
                      method === 'card'
                        ? 'radial-gradient(white 40%, transparent 41%)'
                        : 'none',
                  }}
                />

                {/* Centered Icon */}
                <span className="w-8 h-8 flex items-center justify-center mt-0.5">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                </span>

                <div className="min-w-0">
                  <div className="font-medium text-gray-900">
                    Credit / Debit Card
                  </div>
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
                    {/* <input
                      type="checkbox"
                      checked={saveCardForRentals}
                      onChange={(e) => setSaveCardForRentals(e.target.checked)}
                      className="mt-1"
                    /> */}
                    <input
                      type="checkbox"
                      checked={saveCardForRentals}
                      onChange={(e) => setSaveCardForRentals(e.target.checked)}
                      className="mt-1 w-4 h-4 appearance-none rounded-full border-2 border-gray-300 checked:bg-[#F97316] checked:border-[#F97316] relative"
                      style={{
                        backgroundImage: saveCardForRentals
                          ? 'radial-gradient(white 40%, transparent 41%)'
                          : 'none',
                      }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-black">
                        Save this card securely for monthly rent payments
                      </p>
                      {/* <p className="mt-1 text-[10px] text-gray-500">
                        We can use this card for scheduled debits in future
                        rental renewals.
                      </p> */}
                      <p className="mt-1 text-[10px] text-gray-500 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-gray-500" />
                        We can use this card for scheduled debits in future
                        rental renewals.
                      </p>
                    </div>
                  </label>
                </div>
              ) : null}
            </div>

            {/* <label
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
                  className="mt-1 w-4 h-4 appearance-none rounded-full border-2 border-gray-300 checked:border-[#F97316] checked:bg-[#F97316] relative"
                  style={{
                    backgroundImage:
                      method === 'netbanking'
                        ? 'radial-gradient(white 40%, transparent 41%)'
                        : 'none',
                  }}
                />
                <Landmark className="mt-0.5 h-4 w-4 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        Net Banking
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        All major banks supported
                      </p>
                    </div>
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </label> */}
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
                  className="mt-3 w-4 h-4 appearance-none rounded-full border-2 border-gray-300 checked:border-[#F97316] checked:bg-[#F97316] relative"
                  style={{
                    backgroundImage:
                      method === 'netbanking'
                        ? 'radial-gradient(white 40%, transparent 41%)'
                        : 'none',
                  }}
                />

                {/* Centered Landmark Icon */}
                <span className="w-8 h-8 flex items-center justify-center mt-0.5">
                  <Landmark className="w-4 h-4 text-gray-600" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        Net Banking
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        All major banks supported
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </div>

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
              {/* <CheckCircle2 className="h-4 w-4" /> */}
              {loading ? 'Processing payment…' : 'Pay Now'}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
