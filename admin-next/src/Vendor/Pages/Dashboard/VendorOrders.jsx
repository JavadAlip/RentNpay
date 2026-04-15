'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  IndianRupee,
  Package2,
  Shield,
  ShieldCheck,
  Upload,
  User,
  X,
} from 'lucide-react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import {
  apiCompleteVendorReturnInspection,
  apiGetVendorOrders,
  apiUpdateVendorOrderStatus,
} from '@/service/api';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import VendorReturnRequestedModal from '../../Components/Modals/VendorReturnRequestedModal';

const tabs = [
  'Processing',
  'Dispatched',
  'In Transit',
  'Cancelled',
  'Delivered',
  'Pickup',
  // 'Completed',
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const makeOtp = () => String(1000 + Math.floor(Math.random() * 9000));

function normalizeBool(v) {
  if (v === true || v === false) return v;
  if (typeof v === 'string') {
    const x = v.trim().toLowerCase();
    if (['true', 'yes', '1'].includes(x)) return true;
    if (['false', 'no', '0'].includes(x)) return false;
  }
  return null;
}

function productRequiresInstallation(product) {
  if (!product || typeof product !== 'object') return false;

  // Prefer explicit backend flags when available.
  const explicitCandidates = [
    product?.requiresInstallation,
    product?.installationRequired,
    product?.logisticsVerification?.requiresInstallation,
    product?.logisticsVerification?.installationRequired,
    product?.logisticsVerification?.needsInstallation,
  ];
  for (const candidate of explicitCandidates) {
    const parsed = normalizeBool(candidate);
    if (parsed !== null) return parsed;
  }

  // Dynamic fallback by category + subcategory from product data.
  const category = String(product?.category || '')
    .trim()
    .toLowerCase();
  const subCategory = String(product?.subCategory || '')
    .trim()
    .toLowerCase();
  const key = `${category} ${subCategory}`.trim();
  if (!key) return false;

  // Known non-installation families.
  if (
    /\b(mobile|smartphone|phone|cellphone|laptop|tablet|watch|earbud|headphone|charger|power bank)\b/.test(
      key,
    )
  ) {
    return false;
  }

  // Known installation-required families.
  if (
    /\b(ac|air conditioner|split ac|window ac|geyser|water heater|chimney|hob|cooktop|wall mount|tv mount)\b/.test(
      key,
    )
  ) {
    return true;
  }

  return false;
}

const mapTabToStatuses = (tab) => {
  if (tab === 'Processing') return ['pending', 'confirmed'];
  if (tab === 'Dispatched') return ['shipped'];
  if (tab === 'In Transit') return ['shipped'];
  if (tab === 'Cancelled') return ['cancelled'];
  if (tab === 'Delivered') return ['delivered'];
  // if (tab === 'Completed') return ['completed'];
  if (tab === 'Pickup') return [];
  return [];
};

const statusBadgeClasses = (statusRaw) => {
  const status = String(statusRaw || '').toLowerCase();
  if (status === 'pending' || status === 'confirmed') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (status === 'shipped') {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }
  if (status === 'delivered') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  // if (status === 'completed') {
  //   return 'border-violet-200 bg-violet-50 text-violet-700';
  // }
  if (status === 'cancelled') {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  return 'border-gray-200 bg-gray-50 text-gray-700';
};

function lineMatchesVendor(line, vendorIdStr) {
  const p = line?.product;
  if (!p || typeof p === 'string') return false;
  const vid = p.vendorId?._id ?? p.vendorId;
  return String(vid) === vendorIdStr;
}

function vendorScheduledReturnLine(order, vendorIdStr) {
  return (order?.products || []).find((line) => {
    if (!lineMatchesVendor(line, vendorIdStr)) return false;
    return (
      Boolean(line?.returnRequest?.pickupScheduledAt) &&
      !line?.returnRequest?.refundInitiatedAt
    );
  });
}

function vendorReturnRequestedLine(order, vendorIdStr) {
  return (order?.products || []).find((line) => {
    if (!lineMatchesVendor(line, vendorIdStr)) return false;
    return Boolean(line?.returnRequest?.requestedAt);
  });
}

/** Same row shape as admin Orders, but amount / primary product are only this vendor's lines. */
function normalizeVendorOrder(order, vendorIdStr) {
  const dur = Math.max(1, Number(order.rentalDuration || 1));
  const myLines = (order.products || []).filter((l) =>
    lineMatchesVendor(l, vendorIdStr),
  );
  const amount = myLines.reduce(
    (s, i) => s + Number(i.pricePerDay || 0) * Number(i.quantity || 0) * dur,
    0,
  );
  const scheduledLine = vendorScheduledReturnLine(order, vendorIdStr);
  const primary = scheduledLine || myLines[0];
  const product = primary?.product;
  const rr = primary?.returnRequest || {};
  return {
    ...order,
    amount,
    displayId: `ORD-${String(order._id).slice(-3).toUpperCase()}`,
    customerName: order.user?.fullName || order.name || '-',
    productName: product?.productName || 'Product',
    productImage: product?.image || '',
    primaryProduct: product || null,
    primaryLine: primary || null,
    refundableDeposit: Math.max(0, Number(primary?.refundableDeposit || 0)),
    returnRequest: rr,
    hasScheduledReturnPickup: Boolean(
      scheduledLine?.returnRequest?.pickupScheduledAt &&
      !scheduledLine?.returnRequest?.refundInitiatedAt,
    ),
  };
}

function DeliveryVerificationModal({
  open,
  order,
  otp,
  otpInput,
  setOtpInput,
  installationDone,
  setInstallationDone,
  confirming,
  onClose,
  onConfirm,
}) {
  const otpInputRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  if (!open || !order) return null;
  const productTitle = order.productName || 'Product';
  const firstSku = `SKU-${String(order._id || '')
    .slice(-6)
    .toUpperCase()}`;
  const requiresInstallation = productRequiresInstallation(
    order.primaryProduct,
  );
  const orderValue = Number(order.amount || 0);
  const payoutValue = Number(order.amount || 0);
  const otpOk = otpInput.length === 4 && otpInput === otp;
  const canConfirm =
    otpOk && (!requiresInstallation || installationDone) && !confirming;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[20px] bg-white border border-gray-200 shadow-2xl overflow-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[34px] leading-[1.05] font-semibold text-gray-900">
                  Delivery Verification
                </h2>
                <p className="text-sm text-gray-500">
                  Confirm handover with customer OTP
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close delivery verification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <p className="text-gray-600 inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400">Order:</span>{' '}
              <span className="font-semibold text-gray-900">
                #{order.displayId}
              </span>
            </p>
            <p className="text-gray-600 inline-flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400">Customer:</span>{' '}
              <span className="font-semibold text-gray-900">
                {order.customerName || '-'}
              </span>
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 text-sm inline-flex items-center gap-2">
              <Package2 className="h-4 w-4 text-gray-500" />
              Items Being Delivered
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-800 font-medium">
                  {productTitle}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">SKU : {firstSku}</p>
              </div>
              {requiresInstallation ? (
                <span className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                  Requires Installation
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <p className="font-semibold text-gray-900 inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              Proof of Delivery (OTP)
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Ask the customer for the 4-digit OTP sent to their phone
            </p>
            <div
              className="mt-3 flex items-center justify-center gap-3"
              onClick={() => otpInputRef.current?.focus()}
            >
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="h-12 w-12 rounded-xl border border-gray-300 bg-white text-lg font-semibold text-gray-900 flex items-center justify-center"
                >
                  {otpInput[idx] ? (
                    otpInput[idx]
                  ) : (
                    <span className="text-gray-300">•</span>
                  )}
                </div>
              ))}
              <input
                ref={otpInputRef}
                value={otpInput}
                onChange={(e) =>
                  setOtpInput(
                    String(e.target.value || '')
                      .replace(/\D/g, '')
                      .slice(0, 4),
                  )
                }
                className="sr-only"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              Dummy OTP for test:{' '}
              <span className="font-semibold tracking-widest">{otp}</span>
            </p>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 inline-flex items-start gap-2 w-full">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
              The customer received this OTP via SMS when the order was marked
              as &quot;Out for Delivery&quot;. This confirms they have received
              the items.
            </div>
          </div>

          {requiresInstallation ? (
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
              <p className="font-semibold text-gray-900 inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-violet-100 text-violet-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                </span>
                Installation Required
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Some items need installation before delivery completion
              </p>
              <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Items to install
                </p>
                <p className="mt-1 text-sm text-gray-800">{productTitle}</p>
              </div>
              <label className="mt-3 flex items-start gap-3 rounded-xl border border-violet-200 bg-white px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={installationDone}
                  onChange={(e) =>
                    setInstallationDone(Boolean(e.target.checked))
                  }
                  className="mt-0.5 h-5 w-5 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <span>
                  <span className="text-sm font-semibold text-gray-900">
                    Installation Completed{' '}
                    <span className="text-red-500">*</span>
                  </span>
                  <span className="block text-xs text-gray-500">
                    Check this box after completing installation and testing
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900 inline-flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-orange-500" />
              Settlement Preview
            </p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500">Order Value</span>
              <span className="font-semibold text-gray-900">
                {money(orderValue)}
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-900">
                Your Payout
              </span>
              <span className="text-2xl font-bold text-amber-700">
                {money(payoutValue)}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Will move to{' '}
              <span className="font-semibold">Pending Settlement</span> after
              delivery confirmation
            </p>
          </div>

          {!canConfirm ? (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 flex gap-2">
              <CircleAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold block">
                  Complete Required Steps
                </span>
                <span className="block text-xs mt-1">
                  {otpOk ? '✓' : '✗'} Enter the 4-digit OTP from customer
                </span>
                {requiresInstallation ? (
                  <span className="block text-xs">
                    {installationDone ? '✓' : '✗'} Confirm installation is
                    completed
                  </span>
                ) : null}
              </span>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 flex gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>OTP verified. Ready to confirm delivery.</span>
            </div>
          )}

          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className="mt-5 w-full rounded-xl bg-[#FF6F00] py-3 text-sm font-semibold text-white enabled:hover:bg-[#e56400] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm inline-flex items-center justify-center gap-2"
          >
            {confirming ? (
              'Confirming...'
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Delivery
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReturnInspectionModal({
  open,
  order,
  checklist,
  setChecklist,
  pickupPhotoName,
  setPickupPhotoName,
  damageDeduction,
  setDamageDeduction,
  cleaningFees,
  setCleaningFees,
  authorizeRefund,
  setAuthorizeRefund,
  submitting,
  onClose,
  onSubmit,
}) {
  const [pickupPhotoPreview, setPickupPhotoPreview] = useState('');

  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (pickupPhotoPreview) {
        URL.revokeObjectURL(pickupPhotoPreview);
      }
    };
  }, [pickupPhotoPreview]);

  if (!open || !order) return null;

  const depositHeld = Math.max(0, Number(order?.refundableDeposit || 0));
  const safeDamage = Math.max(0, Number(damageDeduction || 0));
  const safeCleaning = Math.max(0, Number(cleaningFees || 0));
  const finalRefundAmount = Math.max(
    0,
    depositHeld - safeDamage - safeCleaning,
  );
  const canSubmit = Boolean(pickupPhotoName && authorizeRefund) && !submitting;
  const originalPhotoTakenOn = (() => {
    const src = order?.primaryProduct?.createdAt || order?.createdAt;
    if (!src) return '—';
    const d = new Date(src);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  })();

  const checklistRows = [
    {
      key: 'powerFunctionCheck',
      label: 'Power / Function Check',
      hint: 'All features working as expected',
    },
    {
      key: 'surfaceScratches',
      label: 'Surface Scratches',
      hint: 'Visible scratches or scuff marks',
    },
    {
      key: 'structuralIntegrity',
      label: 'Structural Integrity',
      hint: 'Frame and build quality intact',
    },
    {
      key: 'accessoriesAccountedFor',
      label: 'Accessories Accounted For',
      hint: 'All included items returned',
    },
    {
      key: 'cleanlinessCheck',
      label: 'Cleanliness Check',
      hint: 'Item returned in clean condition',
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FF7A00] text-white shadow-sm">
                <ClipboardCheck className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-[28px] font-semibold leading-tight text-gray-900">
                  Return Inspection: Order #{order.displayId}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {order.customerName} - {order.productName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              aria-label="Close inspection"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-[27px] font-semibold leading-[1.1] text-gray-900">
              Condition Comparison
            </h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[13px] font-semibold text-gray-700 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Original Delivery Condition
                </p>
                <div className="mt-2 rounded-xl border border-gray-200 bg-white p-2.5">
                  <div className="relative h-[198px] rounded-lg bg-gray-100 overflow-hidden">
                    {order.productImage ? (
                      <img
                        src={order.productImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white">
                      DELIVERED
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">
                    Photo taken on: {originalPhotoTakenOn}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-700 inline-flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-orange-500" />
                  New Pickup Photo *
                </p>
                <label className="mt-2 flex h-[232px] cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-300 bg-[#F9FAFB] text-sm text-gray-600 hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (pickupPhotoPreview) {
                        URL.revokeObjectURL(pickupPhotoPreview);
                      }
                      if (file) {
                        setPickupPhotoName(file.name);
                        setPickupPhotoPreview(URL.createObjectURL(file));
                      } else {
                        setPickupPhotoName('');
                        setPickupPhotoPreview('');
                      }
                    }}
                  />
                  {pickupPhotoPreview ? (
                    <img
                      src={pickupPhotoPreview}
                      alt="Pickup preview"
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF8A1F] text-white shadow-sm">
                        <Upload className="h-5 w-5" />
                      </span>
                      <span className="mt-3 text-[17px] font-semibold text-gray-900">
                        Upload Pickup Photo
                      </span>
                      <span className="mt-1 text-[13px] text-gray-500">
                        Click or drag to upload
                      </span>
                    </>
                  )}
                </label>
                <p className="mt-2 text-[11px] text-gray-400">
                  {pickupPhotoName || 'No file selected'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 bg-[#FCFCFD] p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Inspection Checklist
            </h3>
            <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
              {checklistRows.map((row) => (
                <label
                  key={row.key}
                  className="flex items-center justify-between py-2"
                >
                  <span>
                    <span className="block text-[15px] leading-[1.15] font-semibold text-gray-900">
                      {row.label}
                    </span>
                    <span className="block text-[12px] leading-[1.2] text-gray-500">
                      {row.hint}
                    </span>
                  </span>
                  <span className="relative inline-flex h-8 w-14 items-center">
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[row.key])}
                      onChange={(e) =>
                        setChecklist((prev) => ({
                          ...prev,
                          [row.key]: Boolean(e.target.checked),
                        }))
                      }
                      className="peer sr-only"
                    />
                    <span className="absolute inset-0 rounded-full bg-gray-200 transition peer-checked:bg-emerald-500" />
                    <span className="absolute left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-6" />
                  </span>
                </label>
              ))}

              <div className="mt-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3">
                <p className="inline-flex items-center gap-2 text-[15px] font-semibold leading-[1.1] text-gray-900">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Rentnpay Care Protection
                </p>
                <p className="mt-1 text-[12px] leading-[1.3] text-gray-500">
                  Minor wear (scratches &lt;2cm, light scuff marks) is covered
                  by Rentnpay Care and should not be deducted from the
                  customer&apos;s deposit.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
              <IndianRupee className="h-5 w-5 text-emerald-500" />
              Refund &amp; Deduction Calculator
            </h3>

            <div className="mt-3 rounded-xl border border-gray-200 bg-[#F9FAFB] p-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-[15px] leading-[1.15] text-gray-500">
                  Total Deposit Held
                </span>
                <span className="text-[34px] font-semibold leading-none text-gray-900">
                  {money(depositHeld)}
                </span>
              </div>

              <div className="mt-4">
                <label className="text-[15px] font-semibold leading-[1.15] text-gray-900">
                  Damage Deduction
                </label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={damageDeduction}
                    onChange={(e) => setDamageDeduction(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-2 text-sm"
                  />
                </div>
                <p className="mt-1 text-[12px] leading-[1.3] text-gray-500">
                  Amount deducted for repair/replacement costs
                </p>
              </div>

              <div className="mt-3">
                <label className="text-[15px] font-semibold leading-[1.15] text-gray-900">
                  Cleaning Fees
                </label>
                <div className="mt-2 relative max-w-[420px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={cleaningFees}
                    onChange={(e) => setCleaningFees(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="rounded-xl border border-emerald-400 bg-emerald-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold leading-[1.15] text-gray-900">
                      Final Refund Amount
                    </p>
                    <p className="mt-1 text-[12px] leading-[1.3] text-gray-500">
                      Amount to be refunded to customer&apos;s account
                    </p>
                  </div>
                  <span className="text-[34px] font-bold leading-none text-emerald-600">
                    {money(finalRefundAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Authorization
            </h3>
            <label className="mt-3 flex items-start gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
              <input
                type="checkbox"
                checked={authorizeRefund}
                onChange={(e) => setAuthorizeRefund(Boolean(e.target.checked))}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800">
                  I verify that the inspection is complete and authorize the
                  refund of {money(finalRefundAmount)}.
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  By checking this box, you confirm all inspection details are
                  accurate and the refund amount is correct.
                </span>
              </span>
            </label>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="mt-5 w-full rounded-xl bg-[#FF6F00] py-3 text-sm font-semibold text-white enabled:hover:bg-[#e56400] disabled:cursor-not-allowed disabled:bg-orange-200 inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Initiating...'
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Initiate Refund & Close Order
              </>
            )}
          </button>
          <p className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs text-gray-500">
            <CircleAlert className="h-3.5 w-3.5 text-orange-400" />
            Upload pickup photo and complete authorization to proceed
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VendorOrdersPage() {
  const { user, token } = useSelector((s) => s.vendor);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [deliveryModal, setDeliveryModal] = useState({
    open: false,
    order: null,
    otp: '',
  });
  const [otpInput, setOtpInput] = useState('');
  const [installationDone, setInstallationDone] = useState(false);
  const [returnModal, setReturnModal] = useState({
    orderId: null,
    productId: null,
  });
  const [inspectionModal, setInspectionModal] = useState({
    open: false,
    order: null,
  });
  const [inspectionChecklist, setInspectionChecklist] = useState({
    powerFunctionCheck: true,
    surfaceScratches: false,
    structuralIntegrity: true,
    accessoriesAccountedFor: true,
    cleanlinessCheck: true,
  });
  const [inspectionPickupPhotoName, setInspectionPickupPhotoName] =
    useState('');
  const [damageDeduction, setDamageDeduction] = useState('0');
  const [cleaningFees, setCleaningFees] = useState('0');
  const [authorizeRefund, setAuthorizeRefund] = useState(false);
  const [activeTab, setActiveTab] = useState('Processing');
  const [query, setQuery] = useState('');

  const vendorIdStr = String(user?.id || user?._id || '');

  const fetchOrders = useCallback(async () => {
    const authToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null);
    if (!authToken) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiGetVendorOrders(authToken);
      setOrders(res.data || []);
    } catch (err) {
      setOrders([]);
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const onOrdersChanged = () => fetchOrders();
    window.addEventListener('vendor-orders-changed', onOrdersChanged);
    return () =>
      window.removeEventListener('vendor-orders-changed', onOrdersChanged);
  }, [fetchOrders]);

  const normalizedOrders = useMemo(() => {
    if (!vendorIdStr) return [];
    return (orders || []).map((o) => normalizeVendorOrder(o, vendorIdStr));
  }, [orders, vendorIdStr]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allowed = mapTabToStatuses(activeTab);
    return normalizedOrders.filter((o) => {
      if (activeTab !== 'Pickup' && o.hasScheduledReturnPickup) {
        return false;
      }
      const tabMatch = allowed.length
        ? allowed.includes(String(o.status))
        : true;
      if (!tabMatch) return false;
      if (!q) return true;
      return (
        String(o.displayId).toLowerCase().includes(q) ||
        String(o.customerName).toLowerCase().includes(q) ||
        String(o.productName).toLowerCase().includes(q)
      );
    });
  }, [normalizedOrders, activeTab, query]);

  const pickupScheduledOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalizedOrders.filter((o) => {
      if (!o.hasScheduledReturnPickup) return false;
      if (!q) return true;
      return (
        String(o.displayId).toLowerCase().includes(q) ||
        String(o.customerName).toLowerCase().includes(q) ||
        String(o.productName).toLowerCase().includes(q)
      );
    });
  }, [normalizedOrders, query]);

  const stats = useMemo(() => {
    const processing = normalizedOrders.filter((o) =>
      ['pending', 'confirmed'].includes(String(o.status)),
    ).length;
    const totalRevenue = normalizedOrders.reduce(
      (s, o) => s + Number(o.amount || 0),
      0,
    );
    const averageOrder = normalizedOrders.length
      ? Math.round(totalRevenue / normalizedOrders.length)
      : 0;
    const urgentActions = normalizedOrders.filter((o) => {
      const isOpen = !['completed', 'cancelled'].includes(String(o.status));
      if (!isOpen) return false;
      const ageMs = Date.now() - new Date(o.createdAt || 0).getTime();
      return ageMs > 24 * 60 * 60 * 1000;
    }).length;
    return { processing, totalRevenue, averageOrder, urgentActions };
  }, [normalizedOrders]);

  const filteredTotal = useMemo(
    () => filteredOrders.reduce((s, o) => s + Number(o.amount || 0), 0),
    [filteredOrders],
  );

  const tabCounts = useMemo(() => {
    const list = normalizedOrders;
    const shipped = list.filter((x) => String(x.status) === 'shipped').length;
    return {
      Processing: list.filter((x) =>
        ['pending', 'confirmed'].includes(String(x.status)),
      ).length,
      Dispatched: shipped,
      'In Transit': shipped,
      Cancelled: list.filter((x) => String(x.status) === 'cancelled').length,
      Delivered: list.filter((x) => String(x.status) === 'delivered').length,
      Completed: list.filter((x) => String(x.status) === 'completed').length,
      Pickup: list.filter((x) => x.hasScheduledReturnPickup).length,
    };
  }, [normalizedOrders]);

  const showPackaging = (status) =>
    ['pending', 'confirmed'].includes(String(status));
  const showDeliveryAction = (status) => String(status) === 'shipped';
  const showScheduleAction = (order) => {
    if (String(order?.status || '') !== 'cancelled') return false;
    if (order?.hasScheduledReturnPickup) return false;
    return true;
  };

  const openInspectionModal = (order) => {
    setInspectionModal({ open: true, order });
    setInspectionChecklist({
      powerFunctionCheck: true,
      surfaceScratches: false,
      structuralIntegrity: true,
      accessoriesAccountedFor: true,
      cleanlinessCheck: true,
    });
    setInspectionPickupPhotoName('');
    setDamageDeduction('0');
    setCleaningFees('0');
    setAuthorizeRefund(false);
  };

  const closeInspectionModal = () => {
    if (updatingId) return;
    setInspectionModal({ open: false, order: null });
  };

  const submitInspection = async () => {
    const order = inspectionModal.order;
    if (!order?._id) return;
    if (!inspectionPickupPhotoName) {
      toast.error('Please upload pickup photo.');
      return;
    }
    if (!authorizeRefund) {
      toast.error('Please authorize refund to continue.');
      return;
    }

    const authToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null);
    if (!authToken) {
      toast.error('Please login again to continue.');
      return;
    }

    setUpdatingId(order._id);
    try {
      const res = await apiCompleteVendorReturnInspection(
        order._id,
        {
          productId: order?.primaryLine?.product?._id || '',
          inspectionChecklist,
          pickupPhotoName: inspectionPickupPhotoName,
          damageDeduction: Number(damageDeduction || 0),
          cleaningFees: Number(cleaningFees || 0),
          authorizeRefund,
        },
        authToken,
      );
      const updated = res.data;
      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(order._id) ? updated : o)),
      );
      toast.success('Inspection saved. Refund initiated.');
      closeInspectionModal();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          'Failed to initiate refund and close order.',
      );
    } finally {
      setUpdatingId('');
    }
  };

  const openDeliveryModal = (order) => {
    setDeliveryModal({ open: true, order, otp: makeOtp() });
    setOtpInput('');
    setInstallationDone(false);
  };

  const closeDeliveryModal = () => {
    if (updatingId) return;
    setDeliveryModal({ open: false, order: null, otp: '' });
    setOtpInput('');
    setInstallationDone(false);
  };

  const confirmDeliveryFromModal = async () => {
    const order = deliveryModal.order;
    if (!order?._id) return;
    if (otpInput !== deliveryModal.otp) {
      toast.error('OTP does not match.');
      return;
    }
    if (
      productRequiresInstallation(order.primaryProduct) &&
      !installationDone
    ) {
      toast.error('Please confirm installation completed.');
      return;
    }
    const authToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null);
    if (!authToken) {
      toast.error('Please login again to continue.');
      return;
    }
    setUpdatingId(order._id);
    try {
      const res = await apiUpdateVendorOrderStatus(
        order._id,
        'delivered',
        authToken,
      );
      const updated = res.data;
      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(order._id) ? updated : o)),
      );
      toast.success('Delivery confirmed. Status moved to delivered.');
      closeDeliveryModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm delivery');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f3f5f9]">
          <div className="space-y-4 sm:space-y-5 max-w-[1600px]">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500 mt-1">
                Customers who ordered your products. Amounts reflect your lines
                only; status updates apply to the full order (same as admin).
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-14">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white rounded-2xl border border-blue-100 p-4">
                    <p className="text-xs text-gray-500">Total Processing</p>
                    <p className="text-4xl font-semibold text-blue-600 mt-1">
                      {stats.processing}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-emerald-100 p-4">
                    <p className="text-xs text-gray-500">
                      Your revenue (lines)
                    </p>
                    <p className="text-4xl font-semibold text-emerald-600 mt-1">
                      {money(stats.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-violet-100 p-4">
                    <p className="text-xs text-gray-500">Average order</p>
                    <p className="text-4xl font-semibold text-violet-600 mt-1">
                      {money(stats.averageOrder)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-orange-100 p-4">
                    <p className="text-xs text-gray-500">Urgent actions</p>
                    <p className="text-4xl font-semibold text-orange-600 mt-1">
                      {stats.urgentActions}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border ${
                          activeTab === tab
                            ? 'bg-white border-gray-300 shadow-sm text-gray-900'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span>{tab}</span>
                        <span
                          className={`min-w-[1.5rem] h-6 px-1.5 inline-flex items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                            activeTab === tab
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tabCounts[tab] ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search orders, customers, products..."
                    className="w-full sm:max-w-md px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                {activeTab !== 'Pickup' && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-[1060px] w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr className="text-gray-500">
                            <th className="px-4 py-3 text-left font-medium">
                              Order ID
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Customer
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Order Date
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Amount
                            </th>
                            {activeTab !== 'Delivered' ? (
                              <th className="px-4 py-3 text-left font-medium">
                                Action
                              </th>
                            ) : null}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr
                              key={order._id}
                              className="border-t border-gray-100"
                            >
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {order.displayId}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {order.customerName}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {order.productImage ? (
                                    <img
                                      src={order.productImage}
                                      alt=""
                                      className="w-9 h-9 rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-md bg-gray-100" />
                                  )}
                                  <span className="text-gray-800">
                                    {order.productName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {order.createdAt
                                  ? new Date(
                                      order.createdAt,
                                    ).toLocaleDateString('en-GB')
                                  : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1.5 border rounded-lg text-xs font-semibold capitalize ${statusBadgeClasses(order.status)}`}
                                >
                                  {String(order.status || 'unknown')}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {money(order.amount)}
                              </td>
                              {activeTab !== 'Delivered' ? (
                                <td className="px-4 py-3">
                                  {String(order.status || '') ===
                                  'completed' ? (
                                    <span className="text-gray-300 text-xs">
                                      —
                                    </span>
                                  ) : showPackaging(order.status) ? (
                                    <Link
                                      href={`/vendor/orders/${order._id}/pack`}
                                      className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
                                    >
                                      Packaging
                                    </Link>
                                  ) : showDeliveryAction(order.status) ? (
                                    <button
                                      type="button"
                                      onClick={() => openDeliveryModal(order)}
                                      disabled={updatingId === order._id}
                                      className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                                    >
                                      Delivery
                                    </button>
                                  ) : showScheduleAction(order) ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rrLine =
                                          vendorReturnRequestedLine(
                                            order,
                                            vendorIdStr,
                                          );
                                        setReturnModal({
                                          orderId: order._id,
                                          productId:
                                            rrLine?.product?._id || null,
                                        });
                                      }}
                                      className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
                                    >
                                      Schedule
                                    </button>
                                  ) : (
                                    <span className="text-gray-300 text-xs">
                                      —
                                    </span>
                                  )}
                                </td>
                              ) : null}
                            </tr>
                          ))}

                          {filteredOrders.length === 0 && (
                            <tr>
                              <td
                                colSpan={activeTab === 'Delivered' ? 6 : 7}
                                className="px-4 py-10 text-center text-gray-500"
                              >
                                No orders found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#F97316] text-white">
                            <td
                              colSpan={activeTab === 'Delivered' ? 5 : 6}
                              className="px-4 py-3 font-semibold"
                            >
                              Total
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {money(filteredTotal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'Pickup' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-sm bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr className="text-gray-500">
                          <th className="px-4 py-3 text-left font-medium">
                            Order ID
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Order Date
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickupScheduledOrders.map((order) => (
                          <tr
                            key={`pickup-${order._id}`}
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {order.displayId}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {order.customerName}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {order.productImage ? (
                                  <img
                                    src={order.productImage}
                                    alt=""
                                    className="w-9 h-9 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-md bg-gray-100" />
                                )}
                                <span className="text-gray-800">
                                  {order.productName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString(
                                    'en-GB',
                                  )
                                : '-'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {money(order.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => openInspectionModal(order)}
                                className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
                              >
                                Inspection
                              </button>
                            </td>
                          </tr>
                        ))}
                        {pickupScheduledOrders.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center text-gray-500"
                            >
                              No pickup-scheduled returns yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <DeliveryVerificationModal
        open={deliveryModal.open}
        order={deliveryModal.order}
        otp={deliveryModal.otp}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        installationDone={installationDone}
        setInstallationDone={setInstallationDone}
        confirming={Boolean(
          updatingId && deliveryModal.order?._id === updatingId,
        )}
        onClose={closeDeliveryModal}
        onConfirm={confirmDeliveryFromModal}
      />
      <VendorReturnRequestedModal
        open={Boolean(returnModal.orderId)}
        orderId={returnModal.orderId}
        productId={returnModal.productId}
        vendorIdStr={vendorIdStr}
        getToken={() =>
          token ||
          (typeof window !== 'undefined'
            ? localStorage.getItem('vendorToken')
            : null)
        }
        onClose={() => {
          setReturnModal({ orderId: null, productId: null });
          fetchOrders();
        }}
      />
      <ReturnInspectionModal
        open={inspectionModal.open}
        order={inspectionModal.order}
        checklist={inspectionChecklist}
        setChecklist={setInspectionChecklist}
        pickupPhotoName={inspectionPickupPhotoName}
        setPickupPhotoName={setInspectionPickupPhotoName}
        damageDeduction={damageDeduction}
        setDamageDeduction={setDamageDeduction}
        cleaningFees={cleaningFees}
        setCleaningFees={setCleaningFees}
        authorizeRefund={authorizeRefund}
        setAuthorizeRefund={setAuthorizeRefund}
        submitting={Boolean(
          updatingId && inspectionModal.order?._id === updatingId,
        )}
        onClose={closeInspectionModal}
        onSubmit={submitInspection}
      />
    </div>
  );
}
