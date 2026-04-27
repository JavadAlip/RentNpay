'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Clock,
  MapPin,
  Check,
  X,
  Calendar,
  Info,
  CheckCircle,
  IndianRupee,
  CircleCheck,
} from 'lucide-react';
import { apiGetVendorOrder, apiUpdateVendorOrderStatus } from '@/service/api';
import { toast } from 'react-toastify';
import Products from '@/assets/icons/product2.png';

const RESPONSE_WINDOW_MS = 30 * 60 * 1000;
const PLATFORM_FEE_RATE = 0.2;

function productImageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  ).replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function lineMatchesVendor(line, vendorIdStr) {
  const p = line?.product;
  if (!p || typeof p === 'string') return false;
  const vid = p.vendorId?._id ?? p.vendorId;
  return String(vid) === vendorIdStr;
}

function formatSku(product) {
  if (!product || typeof product === 'string') return '—';
  const id = String(product._id || '').replace(/[^a-fA-F0-9]/g, '');
  const tail = id.slice(-6).toUpperCase();
  return tail ? `PRD-${tail}` : '—';
}

function orderDisplayTitle(order) {
  const y = order?.createdAt
    ? new Date(order.createdAt).getFullYear()
    : new Date().getFullYear();
  const tail = String(order?._id || '')
    .replace(/[^a-fA-F0-9]/g, '')
    .slice(-2)
    .toUpperCase();
  return `ORD-${y}-${tail || '00'}`;
}

function vendorLineTotal(line, rentalDuration) {
  const dur = Math.max(1, Number(rentalDuration || 1));
  return Number(line.pricePerDay || 0) * Number(line.quantity || 0) * dur;
}

export default function VendorNewOrderModal({
  open,
  orderId,
  vendorIdStr,
  getToken,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [acting, setActing] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!orderId || !open) return;
    const token = getToken?.();
    if (!token) {
      setError('Please log in again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiGetVendorOrder(orderId, token);
      setOrder(res.data);
    } catch (e) {
      setOrder(null);
      setError(
        e?.response?.data?.message || e?.message || 'Failed to load order',
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, open, getToken]);

  useEffect(() => {
    if (open && orderId) load();
    if (!open) {
      setOrder(null);
      setError('');
    }
  }, [open, orderId, load]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const myLines = useMemo(() => {
    if (!order || !vendorIdStr) return [];
    return (order.products || []).filter((l) =>
      lineMatchesVendor(l, vendorIdStr),
    );
  }, [order, vendorIdStr]);

  const orderValue = useMemo(
    () =>
      myLines.reduce(
        (s, l) => s + vendorLineTotal(l, order?.rentalDuration),
        0,
      ),
    [myLines, order?.rentalDuration],
  );

  const platformFee = Math.round(orderValue * PLATFORM_FEE_RATE);
  const payout = Math.max(0, orderValue - platformFee);

  const deadlineMs = useMemo(() => {
    if (!order?.createdAt) return null;
    return new Date(order.createdAt).getTime() + RESPONSE_WINDOW_MS;
  }, [order?.createdAt]);

  const countdownLabel = useMemo(() => {
    if (deadlineMs == null) return '';
    const left = Math.max(0, deadlineMs - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [deadlineMs, tick]);

  const windowOpen =
    deadlineMs != null &&
    Date.now() < deadlineMs &&
    String(order?.status) === 'pending';

  /** Accept: acknowledge only — order stays `pending`; vendor moves it forward from Orders. */
  const handleAccept = () => {
    toast.success('Order acknowledged.');
    onClose?.();
  };

  const handleDecline = async () => {
    const token = getToken?.();
    if (!token || !orderId) return;
    setActing(true);
    try {
      await apiUpdateVendorOrderStatus(orderId, 'cancelled', token);
      toast.success('Order declined');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vendor-orders-changed'));
      }
      onClose?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update order');
    } finally {
      setActing(false);
    }
  };

  if (!open) return null;

  const customerName = order?.user?.fullName || order?.name || 'Customer';
  const address = order?.address || '';
  const cityLine =
    myLines[0]?.product?.logisticsVerification?.city?.trim() || '';
  const locationLabel = cityLine
    ? `${cityLine}${address ? ` · ${address.split(',')[0]?.trim() || ''}` : ''}`
    : address.slice(0, 72) || 'Address on file';

  const receivedAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-order-title"
        // className="relative w-full max-w-lg max-h-[min(92vh,720px)] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200"
        className="relative w-full max-w-lg max-h-[min(92vh,720px)] overflow-y-auto vendor-login-scroll rounded-2xl bg-white shadow-2xl border border-gray-200"
      >
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : order ? (
          <>
            <div className="bg-gradient-to-r from-[#F97316] to-orange-500 text-white px-4 py-3 flex items-center justify-between gap-3 rounded-t-2xl">
              <div className="flex items-center gap-2 min-w-0">
                <Flame className="w-5 h-5 shrink-0" aria-hidden />
                <h2
                  id="new-order-title"
                  className="text-sm sm:text-base font-bold truncate"
                >
                  New Order #{orderDisplayTitle(order)}
                </h2>
              </div>
              {/* {String(order.status) === 'pending' && windowOpen ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold bg-white text-[#EF4444] px-2.5 py-1 rounded-lg shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  Auto-rejects in {countdownLabel}
                </div>
              ) : String(order.status) === 'pending' ? (
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-lg">
                  Window closed
                </span>
              ) : null} */}
              {String(order.status) === 'pending' && windowOpen ? (
                <div className="flex gap-1.5 text-xs font-semibold bg-[#FEF2F2] text-[#EF4444] px-3 py-1.5 rounded-3xl shrink-0">
                  <Clock className="w-3.5 h-3.5 mt-0.5" />

                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-medium">Auto-rejects in</span>
                    <span className="text-right text-sm">{countdownLabel}</span>
                  </div>
                </div>
              ) : String(order.status) === 'pending' ? (
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-lg">
                  Window closed
                </span>
              ) : null}
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-gray-600  text-sm">customer details</p>
                  <p className="text-lg font-bold text-gray-900">
                    {customerName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                    {locationLabel}
                  </p>
                </div>
                {/* <span className="text-[10px] font-bold tracking-wide border border-[#7BF1A8] text-[#00A63E] bg-emerald-50 px-2.5 py-1 rounded-md">
                  PAID — Payment secured
                </span> */}
                <span className="text-[10px] font-bold tracking-wide border border-[#7BF1A8] text-[#00A63E] bg-emerald-50 px-2.5 py-1 rounded-md inline-flex flex-col gap-0.5">
                  {/* First line */}
                  <span className="flex items-center uppercase gap-1">
                    <CircleCheck className="w-3 h-3" />
                    Paid
                  </span>

                  {/* Second line */}
                  <span className="font-medium text-[9px]">
                    Payment secured
                  </span>
                </span>
              </div>

              <div>
                {/* <p className="text-sm font-semibold text-gray-500  tracking-wide mb-2">
                  Order items
                </p> */}
                <div className="flex items-center gap-2 mb-2">
                  <img src={Products.src} alt="products" className="w-4 h-4" />
                  <p className="text-sm font-semibold text-gray-500 tracking-wide">
                    Order items
                  </p>
                </div>
                {/* <ul className="space-y-2">
                  {myLines.map((line, idx) => {
                    const p = line.product;
                    const name =
                      (p && typeof p === 'object' && p.productName) ||
                      'Product';
                    return (
                      <li
                        key={`${line.product?._id || idx}-${idx}`}
                        className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5"
                      >
                        <p className="font-semibold text-gray-900 text-sm">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          SKU: {formatSku(p)} · Qty ×{line.quantity ?? 1}
                        </p>
                      </li>
                    );
                  })}
                </ul> */}
                <ul className="space-y-2">
                  {myLines.map((line, idx) => {
                    const p = line.product;
                    const name =
                      (p && typeof p === 'object' && p.productName) ||
                      'Product';

                    return (
                      <li
                        key={`${line.product?._id || idx}-${idx}`}
                        className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 flex items-center justify-between"
                      >
                        {/* Left */}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            SKU: {formatSku(p)}
                          </p>
                        </div>

                        {/* Right: Qty */}
                        <span className="text-xs font-semibold text-gray-700 bg-white border border-gray-300 px-2 py-0.5 rounded-md">
                          ×{line.quantity ?? 1}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
                <p className="font-semibold flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-[#F97316]" />
                  Financial Summary
                </p>
                <div className="flex justify-between text-[#64748B]">
                  <span>Order value</span>
                  <span className="font-semibold text-black text-sm">
                    ₹{Number(orderValue).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Platform fee </span>
                  <span className="font-semibold text-red-600 text-xs">
                    − ₹{Number(platformFee).toLocaleString('en-IN')}
                  </span>
                </div>
                {/* <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/60 px-3 py-3 mt-2">
                  <p className="text-xs text-emerald-800 font-medium">
                    Your payout 
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                    ₹{Number(payout).toLocaleString('en-IN')}
                  </p>
                </div> */}
                <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/60 px-3 py-3 flex items-center justify-between">
                  <p className="text-xs text-[#008236] font-medium">
                    Your payout
                  </p>

                  <p className="text-2xl font-bold text-[#008236]">
                    ₹{Number(payout).toLocaleString('en-IN')}
                  </p>
                </div>
                {/* <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Settlement cycle: Weekly (as per platform terms)
                </div> */}
                <div className="flex items-center gap-1 text-xs text-gray-500 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Settlement cycle:{' '}
                  <span className="font-semibold text-black">Weekly</span> (as
                  per platform terms)
                </div>
              </div>

              {String(order.status) === 'pending' && windowOpen ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={handleAccept}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <CircleCheck className="w-4 h-4" />
                    Accept & Confirm Stock
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={handleDecline}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-300 text-red-700 bg-white hover:bg-red-50 text-sm font-semibold disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Decline order
                  </button>
                </div>
              ) : String(order.status) === 'pending' && !windowOpen ? (
                <p>
                  {/* className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" */}
                  {/* The 30-minute response window has ended. Use the Orders page
                  to update this order if needed. */}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Status:{' '}
                  <span className="font-semibold capitalize">
                    {order.status}
                  </span>
                </p>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-900">
                {/* <Info className="w-4 h-4 shrink-0 mt-0.5" /> */}
                {/* <span>
                  Accepting acknowledges the order; status stays pending until
                  you update it from the Orders table (e.g. confirmed, shipped).
                </span> */}
                <span>
                  📌 <span className="font-semibold">Note:</span> Accepting this
                  order confirms you have the items in stock and can fulfill
                  within the promised timeframe.
                </span>
              </div>

              {/* {receivedAt ? (
                <p className="text-center text-[11px] text-gray-400">
                  Order received at {receivedAt} · Please respond within 30
                  minutes
                </p>
              ) : null} */}
              {receivedAt ? (
                <p className="text-center text-[11px] text-gray-400">
                  Order received at{' '}
                  <span className="font-semibold text-black">{receivedAt}</span>{' '}
                  · Please respond within 30 minutes
                </p>
              ) : null}
            </div>

            <div className="px-4 pb-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
