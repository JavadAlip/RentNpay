'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Check,
  Truck,
  Home,
  MapPin,
  CreditCard,
  Package,
  AlertTriangle,
  Info,
  CheckCircle2,
  CheckCircle,
} from 'lucide-react';
import { apiGetMyOrderById, apiCancelMyOrder } from '@/lib/api';
import {
  formatMoney,
  formatOrderDate,
  normalizeStatus,
  orderDisplayId,
  orderGrandTotal,
  primaryProduct,
  productImageUrl,
} from '@/lib/orderRentalUtils';

const ORANGE_TEXT = 'text-[#FF6F00]';
const BLUE_LINK = 'text-sky-600 hover:text-sky-700';
const BLUE_BTN =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-sky-600 text-sky-600 text-sm font-semibold hover:bg-sky-50 transition-colors';

function expectedDeliveryDate(order) {
  const d = order.createdAt ? new Date(order.createdAt) : new Date();
  d.setDate(d.getDate() + 7);
  return formatOrderDate(d);
}

function orderStatusLabel(st) {
  switch (normalizeStatus(st)) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Processing';
    case 'shipped':
      return 'In Transit';
    case 'delivered':
      return 'Delivered';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return String(st || '—');
  }
}

function getCancelPolicy(status) {
  const st = normalizeStatus(status);
  if (st === 'pending')
    return {
      pct: 0,
      message: 'You can cancel for a full refund while the order is pending.',
    };
  if (st === 'confirmed')
    return {
      pct: 5,
      message: 'Per policy, a 5% deduction applies at this stage.',
    };
  if (st === 'shipped')
    return {
      pct: 10,
      message: 'Per policy, a 10% deduction applies at this stage.',
    };
  return null;
}

function trackingBlurb(order) {
  const st = normalizeStatus(order.status);
  const eta = expectedDeliveryDate(order);
  if (st === 'shipped') {
    return `Package is on the way. Expected delivery by ${eta}.`;
  }
  if (st === 'confirmed') {
    return 'Your order is confirmed and being prepared for dispatch.';
  }
  if (st === 'pending') {
    return 'We received your order and will confirm it shortly.';
  }
  if (st === 'delivered' || st === 'completed') {
    return 'This order has been delivered. Thank you for renting with us.';
  }
  return '';
}

function downloadInvoiceStub(order, displayRef, grandTotal) {
  const lines = [
    'RentNPay — Order summary',
    `Reference: ${displayRef}`,
    `Placed: ${formatOrderDate(order.createdAt)}`,
    `Total: ₹${formatMoney(grandTotal)}`,
    '',
    `Ship to: ${order.name || ''}`,
    String(order.address || '').trim(),
    `Phone: ${order.phone || ''}`,
  ];
  const blob = new Blob([lines.join('\n')], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `order-${displayRef}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function ShipmentStepper({ order }) {
  const st = normalizeStatus(order.status);
  const packedDone =
    ['confirmed', 'shipped', 'delivered', 'completed'].includes(st) ||
    Boolean(order.vendorFulfillment?.markedPackedAt);
  const transitDone = ['delivered', 'completed'].includes(st);
  const deliveredDone = transitDone;

  const stepComplete = [true, packedDone, transitDone, deliveredDone];
  const activeStep =
    st === 'pending' ? 1 : st === 'confirmed' || st === 'shipped' ? 2 : -1;

  const lineAfter = (i) => {
    if (i === 0) return true;
    if (i === 1) return packedDone;
    if (i === 2) return transitDone;
    return false;
  };

  const labels = ['Ordered', 'Packed', 'In Transit', 'Delivered'];

  function StepIcon({ i, done, active }) {
    if (done) {
      return (
        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
      );
    }
    if (active && i === 2) {
      return <Truck className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
    if (active && i === 1) {
      return <Package className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
    if (i === 3) {
      return <Home className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
    if (i === 2) {
      return <Truck className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
    return <Package className="w-5 h-5 sm:w-6 sm:h-6" />;
  }

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-start min-w-[280px] sm:min-w-0">
        {labels.flatMap((label, i) => {
          const done = stepComplete[i];
          const active = i === activeStep && activeStep >= 0 && !done;
          const circleClass = done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : active
              ? 'bg-[#FF6F00] border-[#FF6F00] text-white'
              : 'bg-gray-100 border-gray-200 text-gray-400';

          const chunks = [
            <div
              key={`step-${label}`}
              className="flex flex-col items-center flex-1 min-w-0"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border-2 ${circleClass}`}
              >
                <StepIcon i={i} done={done} active={active} />
              </div>
              <p
                className={`mt-2 text-[10px] sm:text-xs font-medium text-center leading-tight px-0.5 ${
                  done || active ? 'text-gray-800' : 'text-gray-500'
                }`}
              >
                {label}
              </p>
            </div>,
          ];
          if (i < labels.length - 1) {
            chunks.push(
              <div
                key={`line-${i}`}
                className="flex-1 h-0.5 self-start mt-5 sm:mt-6 mx-0.5 sm:mx-1 min-w-[12px] rounded-full bg-gray-200 overflow-hidden shrink"
              >
                <div
                  className={`h-full rounded-full ${
                    lineAfter(i) ? 'w-full bg-emerald-500' : 'w-0'
                  }`}
                />
              </div>,
            );
          }
          return chunks;
        })}
      </div>
    </div>
  );
}

export default function OrderTrackPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    apiGetMyOrderById(id)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        setOrder(null);
        setError(err.response?.data?.message || 'Could not load this order.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const displayRef = useMemo(
    () => (order ? `ORD-${orderDisplayId(order)}` : ''),
    [order],
  );
  const grandTotal = order ? orderGrandTotal(order) : 0;
  const policy = order ? getCancelPolicy(order.status) : null;
  const st = order ? normalizeStatus(order.status) : '';
  const showCancel =
    policy && !['delivered', 'completed', 'cancelled'].includes(st);

  const feeAmount =
    policy && grandTotal > 0 ? Math.round((grandTotal * policy.pct) / 100) : 0;
  const refundAmount = Math.max(0, grandTotal - feeAmount);

  const handleCancel = () => {
    if (!order || !policy) return;
    const msg =
      policy.pct > 0
        ? `Cancel this order? A ${policy.pct}% fee applies. Estimated refund: ₹${formatMoney(refundAmount)}.`
        : 'Cancel this order for a full refund?';
    if (!window.confirm(msg)) return;
    setCancelling(true);
    apiCancelMyOrder(order._id)
      .then(() => {
        router.push('/orders');
      })
      .catch((err) => {
        window.alert(
          err.response?.data?.message ||
            'Cancellation failed. Please try again or contact support.',
        );
      })
      .finally(() => setCancelling(false));
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#F4F6FB]">
        <div className="w-10 h-10 border-4 border-[#FF6F00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[50vh] bg-[#F4F6FB] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-600 font-medium">
            {error || 'Order not found'}
          </p>
          <Link
            href="/orders"
            className={`inline-flex items-center gap-2 mt-6 text-sm font-bold ${ORANGE_TEXT}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (st === 'cancelled') {
    return (
      <div className="min-h-screen bg-[#F4F6FB] py-8 px-4 sm:px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/orders"
            className={`inline-flex items-center gap-2 text-sm font-medium ${BLUE_LINK}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-lg font-bold text-gray-900">
              Order #{displayRef}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This order was cancelled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const product = primaryProduct(order);
  const blurb = trackingBlurb(order);

  return (
    <div className="min-h-screen bg-[#F4F6FB] py-8 px-4 sm:px-6 pb-16">
      <div className="max-w-3xl mx-auto">
        {/* <div className="flex flex-col sm:flex-row bg-white rounded-xl sm:items-start sm:justify-between gap-4">
          <div>
            <Link
              href="/orders"
              className={`inline-flex items-center gap-2 text-sm font-medium ${BLUE_LINK}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-4">
              Order #{displayRef}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {formatOrderDate(order.createdAt)} · Total: ₹
              {formatMoney(grandTotal)}
            </p>
          </div>
          <button
            type="button"
            className={`${BLUE_BTN} shrink-0 self-start sm:self-auto`}
            onClick={() => downloadInvoiceStub(order, displayRef, grandTotal)}
          >
            <Download className="w-4 h-4" />
            Download Invoice
          </button>
        </div> */}
        <div className="flex flex-col sm:flex-row bg-white rounded-xl p-4 sm:p-6 items-start sm:items-start justify-between gap-4 shadow-sm border border-gray-100">
          <div>
            <Link
              href="/orders"
              className={`inline-flex items-center gap-2 text-sm font-medium ${BLUE_LINK}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-4">
              Order #{displayRef}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Placed on {formatOrderDate(order.createdAt)} · Total:
              <span className="font-bold text-gray-900">
                ₹{formatMoney(grandTotal)}
              </span>
            </p>
          </div>

          <button
            type="button"
            className={`${BLUE_BTN} shrink-0 self-start  mt-6 sm:self-auto`}
            onClick={() => downloadInvoiceStub(order, displayRef, grandTotal)}
          >
            <Download className="w-4 h-4" />
            Download Invoice
          </button>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-gray-900">Shipment Status</h2>
          <div className="mt-6">
            <ShipmentStepper order={order} />
          </div>
          {blurb ? (
            <div className="mt-6 flex gap-2 rounded-lg bg-[#EFF6FF] border-2 border-[#BEDBFF] px-4 py-3 text-sm text-black">
              <Package className="w-4 h-4 shrink-0 text-black mt-0.5" />
              <p className="text-sm font-semibold">{blurb}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-5 bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-gray-900">Order Contents</h2>
          {/* <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MapPin className="w-4 h-4 text-sky-600" />
                Shipping Address
              </div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                {order.name}
                <br />
                {String(order.address || '')
                  .split(/[\n,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .join(', ') || order.address}
              </p>
              {order.phone ? (
                <p className="text-sm text-gray-500 mt-2">
                  Phone: {order.phone}
                </p>
              ) : null}
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment Method
              </div>
              <p className="mt-3 text-sm text-gray-700">Paid online</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                Payment successful
              </p>
            </div>
          </div> */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <div className="bg-white shadow-md rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <div className="bg-[#EFF6FF] p-1.5 rounded-lg">
                  <MapPin className="w-4 h-4 text-[#2563EB]" />
                </div>
                Shipping Address
              </div>

              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                {order.name}
                <br />
                {String(order.address || '')
                  .split(/[\n,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .join(', ') || order.address}
              </p>

              {order.phone ? (
                <p className="text-sm text-gray-500 mt-2">
                  Phone: {order.phone}
                </p>
              ) : null}
            </div>

            {/* Payment Method */}
            <div className="bg-white shadow-md rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <div className="bg-[#F0FDF4] p-1.5 rounded-lg">
                  <CreditCard className="w-4 h-4 text-[#10B981]" />
                </div>
                Payment Method
              </div>

              <p className="mt-3 text-sm text-gray-700">Paid online</p>

              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-[#F0FDF4] text-[#10B981] px-2 py-1 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Payment successful
              </p>
            </div>
          </div>

          {/* {product ? (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Items
              </p>
              <ul className="space-y-3">
                {(order.products || []).map((line, idx) => {
                  const p = line.product;
                  const pop = p && typeof p === 'object' ? p : null;
                  const img = productImageUrl(pop?.image || '');
                  const title = pop?.productName || pop?.title || 'Rental item';
                  return (
                    <li
                      key={pop?._id || idx}
                      className="flex gap-3 items-center"
                    >
                      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Qty {line.quantity ?? 1}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null} */}
        </div>

        {showCancel ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/80 p-5 sm:p-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Want to cancel?
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Review the cancellation terms based on your order status.
                </p>
              </div>
            </div>

            <div className="mt-5 bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                Order status: {orderStatusLabel(order.status)}
              </p>
              <div className="mt-3 flex gap-2 rounded-lg bg-[#FFFBEB] border border-[#FEE685] px-3 py-2.5 text-xs text-[#973C00]">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                {policy.message}
              </div>
            </div>

            <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-bold text-gray-900">
                Refund breakdown
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Original amount</span>
                  <span className="font-medium text-gray-900">
                    ₹{formatMoney(grandTotal)}
                  </span>
                </div>
                {policy.pct > 0 ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">
                      Cancellation fee ({policy.pct}%)
                    </span>
                    <span className="font-medium text-[#EF4444]">
                      − ₹{formatMoney(feeAmount)}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="my-3 border-t border-gray-200" />
              <div className="flex justify-between gap-4 items-center">
                <span className="text-sm font-semibold text-gray-800">
                  Refund amount
                </span>
                <span className="text-lg font-bold text-[#EF4444]">
                  ₹{formatMoney(refundAmount)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancel}
              className="mt-5 w-full py-3.5 rounded-xl bg-[#EF4444] hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold  tracking-wide transition-colors"
            >
              {cancelling
                ? 'Processing…'
                : policy.pct > 0
                  ? 'Accept deduction & cancel order'
                  : 'Cancel order'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              By clicking, you agree to the cancellation fee and refund terms
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
