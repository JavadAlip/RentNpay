'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  FileSearch,
  RefreshCw,
  Calendar,
  MapPin,
} from 'lucide-react';
import { apiGetMyOrderById } from '@/lib/api';
import { primaryProduct } from '@/lib/orderRentalUtils';

function orderReturnLine(order) {
  return (order.products || []).find((line) => {
    return Boolean(line?.returnRequest?.requestedAt);
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPickupWindow(iso, slot) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const safeSlot = String(slot || '').trim();
  return `${d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}${safeSlot ? `, ${safeSlot}` : ''}`;
}

export default function ReturnStatus() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Missing order.');
      return;
    }
    setLoading(true);
    setError('');
    apiGetMyOrderById(orderId)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        setOrder(null);
        setError(err.response?.data?.message || 'Failed to load return status.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const rrLine = order ? orderReturnLine(order) : null;
  const rr = rrLine?.returnRequest;
  const product = useMemo(() => {
    if (!order) return null;
    const p = rrLine?.product;
    if (p && typeof p === 'object') return p;
    return primaryProduct(order);
  }, [order, rrLine]);

  const title = product?.productName || product?.title || 'Rental item';
  const retBadge = order
    ? `RET-${String(order._id || '').slice(-4).toUpperCase()}`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF6F00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order || !rr?.requestedAt) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] py-10 px-4">
        <div className="max-w-2xl mx-auto rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 text-sm">
          {error ||
            'Return details were not found for this order. Open it from My Orders after scheduling a pickup.'}
        </div>
        <div className="max-w-2xl mx-auto mt-4">
          <Link
            href="/orders"
            className="text-sm font-medium text-[#FF6F00] hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const pickupIso = rr.vendorPickupDate || rr.pickupDate;
  const hasPickupScheduled = Boolean(rr.pickupScheduledAt);

  return (
    <div className="min-h-screen bg-[#F4F6FB] py-8 px-4 sm:px-6 pb-16">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Return Status
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Track your return and refund status for{' '}
              <span className="font-semibold text-gray-900">{title}</span>
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 text-xs font-semibold">
            #{retBadge}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
          <ol className="relative space-y-0">
            <li className="relative pb-8">
              <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-emerald-500" />
              <div className="flex gap-4">
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-bold text-gray-900">Request Placed</p>
                  <p className="text-sm font-medium text-emerald-600">Completed</p>
                  <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    {formatDateTime(rr.requestedAt)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Your return request has been successfully submitted.
                  </p>
                </div>
              </div>
            </li>

            <li className="relative pb-8">
              <div
                className={`absolute left-[17px] top-10 bottom-0 w-0.5 ${
                  hasPickupScheduled ? 'bg-blue-400' : 'bg-gray-200'
                }`}
              />
              <div className="flex gap-4">
                <div
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    hasPickupScheduled
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`font-bold ${hasPickupScheduled ? 'text-gray-900' : 'text-gray-500'}`}>
                    Pickup Scheduled
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      hasPickupScheduled ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {hasPickupScheduled ? 'In Progress' : 'Pending'}
                  </p>
                  {hasPickupScheduled ? (
                    <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-gray-800 space-y-2">
                      <p className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          <span className="font-semibold">Scheduled for: </span>
                          {formatPickupWindow(pickupIso, rr.vendorPickupTime)}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          <span className="font-semibold">Pickup from: </span>
                          {rr.vendorPickupAddress ||
                            order.address ||
                            'Your delivery address on file'}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      Vendor will schedule your pickup date and time shortly.
                    </p>
                  )}
                </div>
              </div>
            </li>

            <li className="relative pb-8">
              <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-gray-200" />
              <div className="flex gap-4">
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                  <FileSearch className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-bold text-gray-500">Quality Check (QC)</p>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Our technician will verify the item condition and assess any
                    damage.
                  </p>
                </div>
              </div>
            </li>

            <li className="relative">
              <div className="flex gap-4">
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-bold text-gray-500">Refund Initiated</p>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Deposit will be refunded to your original payment source
                    within 7 days of QC completion.
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </div>

        <p className="mt-10 text-center text-sm text-gray-600">
          Need help with your return?{' '}
          <a
            href="mailto:support@rentnpay.com"
            className="font-semibold text-[#FF6F00] hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
