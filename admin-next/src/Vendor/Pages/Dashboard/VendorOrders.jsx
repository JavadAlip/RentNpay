'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  IndianRupee,
  Package2,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { apiGetVendorOrders, apiUpdateVendorOrderStatus } from '@/service/api';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const tabs = [
  'Processing',
  'Dispatched',
  'In Transit',
  'Cancelled',
  'Delivered',
  'Completed',
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const makeOtp = () =>
  String(1000 + Math.floor(Math.random() * 9000));

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

  // Fallback: infer from product/category naming.
  const raw = [
    product?.productName,
    product?.name,
    product?.category?.name,
    product?.subCategory?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!raw) return false;

  // Items that typically do NOT require installation.
  if (
    /\b(mobile|smartphone|phone|cellphone|laptop|tablet|watch|earbud|headphone|power bank|charger)\b/.test(
      raw,
    )
  ) {
    return false;
  }

  // Items that typically require technician/site installation.
  if (
    /\b(ac|air conditioner|split ac|window ac|geyser|water heater|chimney|hob|tv wall|wall mount|installation)\b/.test(
      raw,
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
  if (tab === 'Completed') return ['completed'];
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
  if (status === 'completed') {
    return 'border-violet-200 bg-violet-50 text-violet-700';
  }
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

/** Same row shape as admin Orders, but amount / primary product are only this vendor's lines. */
function normalizeVendorOrder(order, vendorIdStr) {
  const dur = Math.max(1, Number(order.rentalDuration || 1));
  const myLines = (order.products || []).filter((l) =>
    lineMatchesVendor(l, vendorIdStr),
  );
  const amount = myLines.reduce(
    (s, i) =>
      s +
      Number(i.pricePerDay || 0) * Number(i.quantity || 0) * dur,
    0,
  );
  const primary = myLines[0];
  const product = primary?.product;
  return {
    ...order,
    amount,
    displayId: `ORD-${String(order._id).slice(-3).toUpperCase()}`,
    customerName: order.user?.fullName || order.name || '-',
    productName: product?.productName || 'Product',
    productImage: product?.image || '',
    primaryProduct: product || null,
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
  const firstSku = `SKU-${String(order._id || '').slice(-6).toUpperCase()}`;
  const requiresInstallation = productRequiresInstallation(order.primaryProduct);
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
              <span className="font-semibold text-gray-900">#{order.displayId}</span>
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
                <p className="text-sm text-gray-800 font-medium">{productTitle}</p>
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
              <AlertCircle className="h-4 w-4 text-orange-500" />
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
                  {otpInput[idx] ? otpInput[idx] : <span className="text-gray-300">•</span>}
                </div>
              ))}
              <input
                ref={otpInputRef}
                value={otpInput}
                onChange={(e) =>
                  setOtpInput(
                    String(e.target.value || '').replace(/\D/g, '').slice(0, 4),
                  )
                }
                className="sr-only"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              Dummy OTP for test: <span className="font-semibold tracking-widest">{otp}</span>
            </p>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 inline-flex items-start gap-2 w-full">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
              The customer received this OTP via SMS when the order was marked as
              "Out for Delivery". This confirms they have received the items.
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
                  onChange={(e) => setInstallationDone(Boolean(e.target.checked))}
                  className="mt-0.5 h-5 w-5 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <span>
                  <span className="text-sm font-semibold text-gray-900">
                    Installation Completed <span className="text-red-500">*</span>
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
              <span className="font-semibold text-gray-900">{money(orderValue)}</span>
            </div>
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-900">Your Payout</span>
              <span className="text-2xl font-bold text-amber-700">{money(payoutValue)}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Will move to <span className="font-semibold">Pending Settlement</span> after delivery confirmation
            </p>
          </div>

          {!canConfirm ? (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 flex gap-2">
              <CircleAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold block">Complete Required Steps</span>
                <span className="block text-xs mt-1">
                  {otpOk ? '✓' : '✗'} Enter the 4-digit OTP from customer
                </span>
                {requiresInstallation ? (
                  <span className="block text-xs">
                    {installationDone ? '✓' : '✗'} Confirm installation is completed
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
            className="mt-5 w-full rounded-xl bg-[#FF6F00] py-3 text-sm font-semibold text-white enabled:hover:bg-[#e56400] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm"
          >
            {confirming ? 'Confirming...' : 'Confirm Delivery'}
          </button>
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
  const [activeTab, setActiveTab] = useState('Processing');
  const [query, setQuery] = useState('');

  const vendorIdStr = String(user?.id || user?._id || '');

  const fetchOrders = useCallback(async () => {
    const authToken =
      token ||
      (typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null);
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
      const tabMatch = allowed.length ? allowed.includes(String(o.status)) : true;
      if (!tabMatch) return false;
      if (!q) return true;
      return (
        String(o.displayId).toLowerCase().includes(q) ||
        String(o.customerName).toLowerCase().includes(q) ||
        String(o.productName).toLowerCase().includes(q)
      );
    });
  }, [normalizedOrders, activeTab, query]);

  const stats = useMemo(() => {
    const processing = normalizedOrders.filter((o) =>
      ['pending', 'confirmed'].includes(String(o.status)),
    ).length;
    const totalRevenue = normalizedOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
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
    };
  }, [normalizedOrders]);

  const showPackaging = (status) =>
    ['pending', 'confirmed'].includes(String(status));
  const showDeliveryAction = (status) => String(status) === 'shipped';

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
      (typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null);
    if (!authToken) {
      toast.error('Please login again to continue.');
      return;
    }
    setUpdatingId(order._id);
    try {
      const res = await apiUpdateVendorOrderStatus(order._id, 'delivered', authToken);
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
                Customers who ordered your products. Amounts reflect your lines only;
                status updates apply to the full order (same as admin).
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
                    <p className="text-xs text-gray-500">Your revenue (lines)</p>
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

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1060px] w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr className="text-gray-500">
                          <th className="px-4 py-3 text-left font-medium">Order ID</th>
                          <th className="px-4 py-3 text-left font-medium">Customer</th>
                          <th className="px-4 py-3 text-left font-medium">Your product</th>
                          <th className="px-4 py-3 text-left font-medium">Order Date</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Your amount</th>
                          <th className="px-4 py-3 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order._id} className="border-t border-gray-100">
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
                                <span className="text-gray-800">{order.productName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-GB')
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
                            <td className="px-4 py-3">
                              {showPackaging(order.status) ? (
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
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {filteredOrders.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-10 text-center text-gray-500"
                            >
                              No orders found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#F97316] text-white">
                          <td colSpan={6} className="px-4 py-3 font-semibold">
                            Total (your lines)
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {money(filteredTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
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
        confirming={Boolean(updatingId && deliveryModal.order?._id === updatingId)}
        onClose={closeDeliveryModal}
        onConfirm={confirmDeliveryFromModal}
      />
    </div>
  );
}
