'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Package, Search, User, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  apiApproveProductAndGoLive,
  apiGetProductApprovalQueue,
} from '@/service/api';

function formatDate(iso) {
  const d = iso ? new Date(iso) : null;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatInr(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return '—';
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(num))}`;
}

function formatProductAuditId(id) {
  const raw = String(id || '').trim();
  if (!raw) return 'prod-001';
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '');
  return `prod-${(clean.slice(-6) || '001').toLowerCase()}`;
}

function rentRows(configs = []) {
  return (Array.isArray(configs) ? configs : [])
    .map((cfg) => {
      const isDay = cfg?.periodUnit === 'day';
      const count = isDay ? Number(cfg?.days || 0) : Number(cfg?.months || 0);
      const unit = isDay ? 'Days' : 'Months';
      const label = String(cfg?.label || '').trim() || `${count} ${unit}`;
      const amount =
        Number(cfg?.customerRent || 0) ||
        Number(cfg?.pricePerDay || 0) ||
        Number(cfg?.vendorRent || 0) ||
        0;
      return { label, amount };
    })
    .filter((x) => x.amount > 0);
}

const PAGE_SIZE = 10;

export default function ProductApproval() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, draft: 0 });
  const [selectedId, setSelectedId] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiGetProductApprovalQueue(token, {
        status: 'pending',
      });
      const list = Array.isArray(data?.queue) ? data.queue : [];
      setQueue(list);
      setCounts(data?.counts || { pending: 0, approved: 0, draft: 0 });
      setSelectedId((prev) =>
        prev && list.some((x) => x._id === prev) ? prev : list[0]?._id || '',
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'Failed to load approval queue',
      );
      setQueue([]);
      setCounts({ pending: 0, approved: 0, draft: 0 });
      setSelectedId('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return queue;
    return queue.filter((p) => {
      return (
        String(p.productName || '')
          .toLowerCase()
          .includes(term) ||
        String(p.vendor?.label || '')
          .toLowerCase()
          .includes(term) ||
        String(p.category || '')
          .toLowerCase()
          .includes(term)
      );
    });
  }, [queue, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const selected = useMemo(
    () => filtered.find((x) => x._id === selectedId) || filtered[0] || null,
    [filtered, selectedId],
  );

  useEffect(() => {
    if (!selectedId && filtered[0]?._id) setSelectedId(filtered[0]._id);
    if (selectedId && !filtered.some((x) => x._id === selectedId)) {
      setSelectedId(filtered[0]?._id || '');
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    setPage(1);
  }, [search, queue.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const onApprove = async () => {
    if (!selected?._id) return;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;
    setSaving(true);
    try {
      await apiApproveProductAndGoLive(selected._id, token);
      toast.success('Approved and now live on website');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Approval failed');
    } finally {
      setSaving(false);
    }
  };

  const rows = rentRows(selected?.rentalConfigurations || []);
  const specRows = useMemo(() => {
    const specs =
      selected?.specifications && typeof selected.specifications === 'object'
        ? selected.specifications
        : {};
    return Object.entries(specs)
      .map(([key, value]) => {
        if (value == null) return null;
        if (typeof value === 'string' && !value.trim()) return null;
        const label = String(key || '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (m) => m.toUpperCase());
        const rendered =
          typeof value === 'string'
            ? value
            : typeof value === 'number' || typeof value === 'boolean'
              ? String(value)
              : JSON.stringify(value);
        return { label, value: rendered };
      })
      .filter(Boolean);
  }, [selected]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-orange-500 text-white inline-flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Approval</h1>
            <p className="text-sm text-gray-500">
              {/* Review vendor product submissions before going live. */}
              Review and approve vendor product submissions for marketplace listing
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Pending Approval Queue
                </p>
                <p className="text-xs text-gray-500">
                  {loading
                    ? 'Loading queue...'
                    : `${counts.pending} products awaiting review and approval`}
                </p>
              </div>
              <span className="inline-flex items-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-xs font-semibold">
                {counts.pending} Pending
              </span>
            </div>
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product or vendor"
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-300"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-sm text-gray-500">
                Loading submissions...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-sm text-gray-500">
                No pending products.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Submission Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr
                      key={p._id}
                      className={`border-t cursor-pointer ${
                        selected?._id === p._id
                          ? 'bg-orange-50/40'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(p._id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {p.productName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {[p.category, p.subCategory]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {p.vendor?.label || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          {p.type === 'Sell' ? 'Buy' : 'Rent'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(p.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!loading && filtered.length > 0 ? (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </span>
              {totalPages > 1 ? (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 rounded-md border border-gray-200 bg-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1 rounded-md border border-gray-200 bg-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden h-[calc(100vh-140px)] min-h-[560px]">
          {selected ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-orange-500 text-white inline-flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Product Audit
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {formatProductAuditId(selected._id)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setSelectedId('')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="audit-scroll p-4 space-y-4 h-[calc(100%-57px)] overflow-y-scroll">
                <img
                  src={selected.image}
                  alt={selected.productName}
                  className="w-full h-36 rounded-xl object-cover border border-gray-100"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {selected.productName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selected.shortDescription ||
                      selected.description ||
                      'No description'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Technical Specifications
                  </h3>
                  {specRows.length ? (
                    <div className="space-y-2">
                      {specRows.map((spec) => (
                        <div
                          key={spec.label}
                          className="rounded-lg bg-gray-50 px-3 py-2"
                        >
                          <p className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {spec.label}
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {spec.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      Specifications not provided by vendor.
                    </div>
                  )}
                </div>

                {rows.length ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Pricing Structure
                    </h3>
                    <div className="space-y-1.5">
                      {rows.map((r) => (
                        <div
                          key={`${r.label}-${r.amount}`}
                          className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm flex items-center justify-between"
                        >
                          <span className="text-gray-700">{r.label}</span>
                          <span className="font-semibold text-gray-900">
                            {formatInr(r.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {selected.refundableDeposit > 0 ? (
                      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm flex items-center justify-between">
                        <span className="text-amber-800">Security Deposit</span>
                        <span className="font-semibold text-amber-900">
                          {formatInr(selected.refundableDeposit)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm flex items-center justify-between">
                    <span className="text-gray-700">Sale Price</span>
                    <span className="font-semibold text-gray-900">
                      {formatInr(selected.salesConfiguration?.salePrice)}
                    </span>
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <p className="text-[11px] text-gray-500 inline-flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    Submitted By
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {selected.vendor?.label || 'Vendor'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onApprove}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'Approving...' : 'Approve & Go Live'}
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-gray-500">
              Select a product to audit.
            </div>
          )}
        </aside>
      </div>
      <style jsx>{`
        .audit-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .audit-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
