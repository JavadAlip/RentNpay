'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock3,
  MapPin,
  Package2,
  Package,
  RotateCcw,
  Truck,
  User,
  X,
} from 'lucide-react';
import {
  apiGetVendorOrder,
  apiScheduleVendorReturnPickup,
} from '@/service/api';
import { toast } from 'react-toastify';

function lineMatchesVendor(line, vendorIdStr) {
  const p = line?.product;
  if (!p || typeof p === 'string') return false;
  const vid = p.vendorId?._id ?? p.vendorId;
  return String(vid) === vendorIdStr;
}

function computeTenureEnd(order) {
  const start = order?.createdAt ? new Date(order.createdAt) : new Date();
  const duration = Math.max(1, Number(order?.rentalDuration || 1));
  const unit =
    String(order?.tenureUnit || '').toLowerCase() === 'day' ? 'day' : 'month';
  const out = new Date(start.getTime());
  if (unit === 'day') out.setDate(out.getDate() + duration);
  else out.setMonth(out.getMonth() + duration);
  return out;
}

function formatSku(product) {
  const id = String(product?._id || '').replace(/[^a-fA-F0-9]/g, '');
  const tail = id.slice(-6).toUpperCase();
  return tail ? `SF-${tail}` : '—';
}

export default function VendorReturnRequestedModal({
  open,
  orderId,
  productId,
  vendorIdStr,
  getToken,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('Afternoon');
  const [driver, setDriver] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!open || !orderId) return;
    const token = getToken?.();
    if (!token) {
      setError('Please login again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiGetVendorOrder(orderId, token);
      setOrder(res.data || null);
    } catch (e) {
      setOrder(null);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Failed to load return request',
      );
    } finally {
      setLoading(false);
    }
  }, [open, orderId, getToken]);

  useEffect(() => {
    if (open) load();
    if (!open) {
      setOrder(null);
      setError('');
      setPickupDate('');
      setPickupTime('Afternoon');
      setDriver('');
      setSaving(false);
    }
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const targetLine = useMemo(() => {
    if (!order || !vendorIdStr) return null;
    const lines = (order.products || []).filter((l) =>
      lineMatchesVendor(l, vendorIdStr),
    );
    if (!lines.length) return null;
    if (productId) {
      const exact = lines.find(
        (l) =>
          String(l?.product?._id || '') === String(productId) &&
          l?.returnRequest?.requestedAt,
      );
      if (exact) return exact;
    }
    return lines.find((l) => l?.returnRequest?.requestedAt) || null;
  }, [order, vendorIdStr, productId]);

  useEffect(() => {
    const requestedPickup = targetLine?.returnRequest?.pickupDate;
    if (requestedPickup) {
      const d = new Date(requestedPickup);
      if (!Number.isNaN(d.getTime())) {
        setPickupDate(d.toISOString().slice(0, 10));
        return;
      }
    }
    const t = new Date();
    t.setDate(t.getDate() + 1);
    setPickupDate(t.toISOString().slice(0, 10));
  }, [targetLine]);

  const confirmPickupSchedule = async () => {
    if (!pickupDate) {
      toast.error('Please select pickup date.');
      return;
    }
    if (!driver.trim()) {
      toast.error('Please assign driver.');
      return;
    }
    const token = getToken?.();
    if (!token) {
      toast.error('Please login again.');
      return;
    }
    setSaving(true);
    try {
      await apiScheduleVendorReturnPickup(
        orderId,
        {
          productId: productId || String(targetLine?.product?._id || ''),
          pickupDate,
          pickupTime,
          driverName: driver.trim(),
          pickupAddress: address || '',
        },
        token,
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vendor-orders-changed'));
      }
      toast.success('Pickup schedule confirmed.');
      onClose?.();
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          'Failed to confirm pickup schedule.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const customer = order?.user?.fullName || order?.name || 'Customer';
  const phone = order?.phone || '';
  const address = order?.address || '';
  const product = targetLine?.product;
  const productName = product?.productName || 'Product';
  const tenureEnded = order ? computeTenureEnd(order) : null;
  const tenureEndedLabel =
    tenureEnded && !Number.isNaN(tenureEnded.getTime())
      ? tenureEnded.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div className="relative z-10 w-full max-w-[620px] max-h-[84vh] overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent">
        {loading ? (
          <div className="p-14 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : (
          <div className="p-4 sm:p-[18px]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-sm">
                  <RotateCcw className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <h2 className="text-xl leading-[1] font-medium tracking-[-0.015em] text-gray-900">
                    Return Requested
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    End-of-tenure return process
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Close return requested"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3.5">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium text-gray-900">{customer}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Item:</span>
                <span className="font-medium text-gray-900">{productName}</span>
                <span className="text-gray-400">#{formatSku(product)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Tenure Ended:</span>
                <span className="font-medium text-gray-900">
                  {tenureEndedLabel}
                </span>
              </div>
              {/* <div className="pt-0.5">
                <span className="inline-flex rounded-lg border border-[#8EC5FF] bg-[#DBEAFE] px-3 py-1 text-[11px] font-semibold tracking-[0.03em] text-[#1447E6]">
                  PENDING PICKUP
                </span>
              </div> */}
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#8EC5FF] bg-[#DBEAFE] px-3 py-1 text-[11px] font-semibold tracking-[0.03em] text-[#1447E6]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#155DFC]" />
                  PENDING PICKUP
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-200 pt-4">
              <h3 className="text-lg leading-[1.1] font-medium text-gray-900 inline-flex items-center gap-2">
                <Truck className="w-[18px] h-[18px] text-[#F97316]" />
                Schedule Pickup
              </h3>
              <p className="mt-1 text-gray-500 text-sm">
                Arrange to collect the item from the customer
              </p>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-gray-900">
                      Pickup Date
                    </label>
                    <div className="mt-2 relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-gray-900">
                      Pickup Time
                    </label>
                    <div className="mt-2 relative">
                      <Clock3 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm"
                      >
                        <option>Morning</option>
                        <option>Afternoon</option>
                        <option>Evening</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5">
                  <label className="text-[13px] font-medium text-gray-900">
                    Assign Driver <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    placeholder="Driver name"
                    disabled={saving}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="mt-3.5 rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-gray-600 inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#F97316]" />
                    Pickup Address
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {customer} {phone ? `• ${phone}` : ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address || 'Address on file'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={confirmPickupSchedule}
                  disabled={saving}
                  className="mt-4 w-full rounded-xl bg-[#FF6F00] text-white font-semibold py-3.5 hover:bg-[#e56400] inline-flex items-center justify-center gap-2 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Truck className="w-4 h-4" />
                  {saving
                    ? 'Saving Pickup Schedule...'
                    : 'Confirm Pickup Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
