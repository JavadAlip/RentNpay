'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Package,
  CheckCircle2,
  Circle,
  FileText,
  Tag,
  Printer,
  AlertTriangle,
  Info,
  Truck,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  apiGetVendorOrderPack,
  apiVendorMarkOrderShipped,
} from '@/service/api';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import VendorAssignDeliveryModal from '../../Components/Modals/VendorAssignDeliveryModal';

function productImageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  ).replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function orderDisplayRef(order) {
  const y = order?.createdAt
    ? new Date(order.createdAt).getFullYear()
    : new Date().getFullYear();
  const tail = String(order?._id || '')
    .replace(/[^a-fA-F0-9]/g, '')
    .slice(-2)
    .toUpperCase();
  return `${y}-${tail || '00'}`;
}

function formatSku(product) {
  if (!product || typeof product === 'string') return '—';
  const id = String(product._id || '').replace(/[^a-fA-F0-9]/g, '');
  const tail = id.slice(-6).toUpperCase();
  return tail ? `PRD-${tail}` : '—';
}

function lineMatchesVendor(line, vendorIdStr) {
  const p = line?.product;
  if (!p || typeof p === 'string') return false;
  const vid = p.vendorId?._id ?? p.vendorId;
  return String(vid) === vendorIdStr;
}

function shortCustomerName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/);
  if (!parts[0]) return 'Customer';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

const TASKS = [
  {
    key: 'verifyQuality',
    title: 'Verify item quality',
    detail: 'Check for scratches, damage, or defects before packing.',
  },
  {
    key: 'packSecurely',
    title: 'Pack item securely',
    detail: 'Use bubble wrap, foam, or appropriate packaging material.',
  },
  {
    key: 'labelPasted',
    title: 'Paste shipping label',
    detail: 'Affix the printed label clearly on the package.',
  },
];

function openPrintWindow(title, innerHtml) {
  const w = window.open('', '_blank');
  if (!w) {
    toast.error('Allow pop-ups to print.');
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin-bottom: 8px; }
      .muted { color: #666; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    </style></head><body>${innerHtml}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export default function VendorOrderPackPage({ orderId }) {
  const router = useRouter();
  const { user, token } = useSelector((s) => s.vendor);
  const vendorIdStr = String(user?.id || user?._id || '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [vendorGstin, setVendorGstin] = useState('');
  const [checklist, setChecklist] = useState({
    verifyQuality: false,
    packSecurely: false,
    labelPasted: false,
  });
  const [assignOpen, setAssignOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getToken = useCallback(() => {
    return (
      token ||
      (typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null)
    );
  }, [token]);

  const load = useCallback(async () => {
    const auth = getToken();
    if (!auth || !orderId) {
      setError('Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiGetVendorOrderPack(orderId, auth);
      const o = res.data?.order;
      setOrder(o);
      setVendorGstin(res.data?.vendorGstin || '');
      const fc = o?.vendorFulfillment?.packingChecklist;
      if (fc) {
        setChecklist({
          verifyQuality: !!fc.verifyQuality,
          packSecurely: !!fc.packSecurely,
          labelPasted: !!fc.labelPasted,
        });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load';
      const code = e?.response?.data?.code;
      setOrder(null);
      setError(msg);
      if (code === 'INVALID_STATUS' || e?.response?.status === 400) {
        toast.error(msg);
        router.replace('/vendor/orders');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, getToken, router]);

  useEffect(() => {
    load();
  }, [load]);

  const myLines = useMemo(() => {
    if (!order || !vendorIdStr) return [];
    return (order.products || []).filter((l) =>
      lineMatchesVendor(l, vendorIdStr),
    );
  }, [order, vendorIdStr]);

  const completedCount = useMemo(
    () => TASKS.filter((t) => checklist[t.key]).length,
    [checklist],
  );

  const allChecked = completedCount === TASKS.length;

  const customerName = order?.user?.fullName || order?.name || 'Customer';
  const orderRef = order ? orderDisplayRef(order) : '';
  const cityHint =
    myLines[0]?.product?.logisticsVerification?.city?.trim() || '';
  const deliveryLine = cityHint
    ? `Delivery to: ${cityHint} · ${String(order?.address || '').slice(0, 64)}`
    : `Delivery to: ${String(order?.address || '—').slice(0, 80)}`;

  const printInvoice = () => {
    if (!order) return;
    const rows = myLines
      .map((line) => {
        const p = line.product;
        const n =
          p && typeof p === 'object' ? p.productName : 'Item';
        return `<tr><td>${n}</td><td>${formatSku(p)}</td><td>${line.quantity ?? 1}</td></tr>`;
      })
      .join('');
    openPrintWindow(
      'Tax Invoice',
      `<h1>Tax invoice</h1>
      <p class="muted">Order #ORD-${orderRef} · ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
      <p><strong>Vendor GSTIN:</strong> ${vendorGstin || '—'}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted" style="margin-top:24px">RentNPay — rental order summary (not a legal tax invoice unless configured by your CA).</p>`,
    );
  };

  const printLabel = () => {
    if (!order) return;
    openPrintWindow(
      'Shipping label',
      `<h1>Shipping label</h1>
      <p class="muted">Order #ORD-${orderRef}</p>
      <p><strong>Ship to</strong><br/>${customerName}<br/>${String(order.address || '').replace(/\n/g, '<br/>')}</p>
      <p><strong>Phone</strong> ${order.phone || '—'}</p>
      <p style="margin-top:32px;font-size:11px;color:#666">Barcode / tracking: attach partner label when available.</p>`,
    );
  };

  const toggleTask = (key) => {
    setChecklist((c) => ({ ...c, [key]: !c[key] }));
  };

  const handleMarkShipped = async ({
    method,
    driverName,
    driverPhone,
    vehicleNumber,
    packingChecklist: pc,
  }) => {
    const auth = getToken();
    if (!auth) {
      toast.error('Please log in again.');
      return;
    }
    setSubmitting(true);
    try {
      await apiVendorMarkOrderShipped(
        orderId,
        {
          packingChecklist: pc,
          delivery: {
            method,
            driverName,
            driverPhone,
            vehicleNumber,
          },
        },
        auth,
      );
      toast.success('Order marked as shipped.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vendor-orders-changed'));
      }
      setAssignOpen(false);
      router.push('/vendor/orders');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not mark shipped');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f5f9] overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/vendor/orders"
                className="text-sm font-medium text-[#F97316] hover:underline"
              >
                ← Back to orders
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error && !order ? (
              <div className="bg-white rounded-2xl border border-red-200 p-6 text-red-600 text-sm">
                {error}
              </div>
            ) : order ? (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-gray-900">
                          #ORD-{orderRef}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Processing &amp; packing
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      PROCESSING · In progress
                    </span>
                  </div>
                  <div className="mt-4 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-900">
                    Next step: pack items and attach documents.
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    Packing checklist
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Complete all tasks before marking as packed.
                  </p>
                  <ul className="mt-4 space-y-3">
                    {TASKS.map((task, idx) => {
                      const done = checklist[task.key];
                      return (
                        <li key={task.key}>
                          <button
                            type="button"
                            onClick={() => toggleTask(task.key)}
                            className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors ${
                              done
                                ? 'border-emerald-300 bg-emerald-50/40'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {done ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  Task {idx + 1}/{TASKS.length} — {task.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {task.detail}
                                </p>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${(completedCount / TASKS.length) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {completedCount}/{TASKS.length} completed
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Required documents
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Print and attach these documents to the package.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="w-8 h-8 text-[#F97316] shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">Tax invoice</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          GST-compliant summary with line items.
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Vendor GSTIN:{' '}
                          <span className="font-mono">
                            {vendorGstin || '—'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600">
                          Customer: {customerName}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={printInvoice}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold hover:bg-[#e56400] shrink-0"
                    >
                      <Printer className="w-4 h-4" />
                      Print PDF
                    </button>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Tag className="w-8 h-8 text-blue-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Shipping label
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Address label for the delivery partner.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={printLabel}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shrink-0"
                    >
                      <Printer className="w-4 h-4" />
                      Print label
                    </button>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2.5 text-xs text-orange-900">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    Important: paste the label visibly on the package for easy
                    scanning by the delivery partner.
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Inventory
                  </h2>
                  <ul className="space-y-3">
                    {myLines.map((line, idx) => {
                      const p = line.product;
                      const name =
                        p && typeof p === 'object'
                          ? p.productName
                          : 'Product';
                      const qty = Number(line.quantity || 1);
                      const stock =
                        p && typeof p === 'object'
                          ? Number(p.stock ?? 0)
                          : 0;
                      return (
                        <li
                          key={`${line.product?._id || idx}`}
                          className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3"
                        >
                          <p className="font-semibold text-gray-900 text-sm">
                            {name}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {formatSku(p)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                              −{qty} unit{qty === 1 ? '' : 's'} reserved
                            </span>
                            <span className="text-xs font-medium text-emerald-700">
                              {stock} unit{stock === 1 ? '' : 's'} remaining
                              (current stock)
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2.5 text-xs text-sky-900">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    Stock was adjusted when the customer placed the order. Counts
                    above reflect your current catalog stock.
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                  <button
                    type="button"
                    disabled={!allChecked}
                    onClick={() => setAssignOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Mark as packed &amp; ready
                  </button>
                  <div className="flex items-start justify-center gap-2 mt-3 text-xs text-emerald-800">
                    <Truck className="w-4 h-4 shrink-0 mt-0.5" />
                    Ready to ship — next, assign delivery and mark shipped.
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>

      <VendorAssignDeliveryModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        orderRef={orderRef}
        customerShort={shortCustomerName(customerName)}
        deliveryLine={deliveryLine}
        packingChecklist={checklist}
        submitting={submitting}
        onMarkShipped={handleMarkShipped}
      />
    </div>
  );
}
