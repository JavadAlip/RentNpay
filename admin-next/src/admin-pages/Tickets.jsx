'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MessageSquare,
  Search,
} from 'lucide-react';
import { apiAdminGetTickets } from '@/service/api';

const PAGE_SIZE = 10;

function formatRelativeTime(iso) {
  const d = iso ? new Date(iso) : null;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return 'just now';
  if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} day ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueClass,
  iconWrapClass,
  iconClass,
}) {
  return (
    <div className="bg-white p-4 sm:p-5">
      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-500 inline-flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${iconWrapClass}`}
            >
              <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
            </span>
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tabular-nums ${valueClass}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const solved = status === 'solved';
  if (solved) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
        Query Solved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      Pending
    </span>
  );
}

const AdminTickets = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, solved: 0 });
  const [filter, setFilter] = useState('all'); // all | pending | solved
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await apiAdminGetTickets(token);
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      setSummary(
        data?.summary || {
          total: 0,
          pending: 0,
          solved: 0,
        },
      );
    } catch (err) {
      setTickets([]);
      setSummary({ total: 0, pending: 0, solved: 0 });
      setError(err?.response?.data?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = tickets;
    if (filter === 'pending') list = list.filter((t) => t.status === 'pending');
    if (filter === 'solved') list = list.filter((t) => t.status === 'solved');
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        String(t.customerName || '')
          .toLowerCase()
          .includes(q) ||
        String(t.queryId || '')
          .toLowerCase()
          .includes(q) ||
        String(t.productName || '')
          .toLowerCase()
          .includes(q),
    );
  }, [tickets, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header – same as vendor, but mentions admin */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Queries</h1>
        {/* <p className="text-sm text-gray-500 mt-1">
          Read-only view of all queries vendors receive from the &quot;Report an
          Issue&quot; flow.
        </p> */}
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or QRY ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none pl-3 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-orange-300 min-w-[140px]"
          >
            <option value="all">All queries</option>
            <option value="pending">Pending</option>
            <option value="solved">Solved</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Error banner */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {/* Stat cards – Total / Pending / Solved */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-100 bg-white p-0 shadow-sm overflow-hidden">
          <StatCard
            icon={MessageSquare}
            label="Total Queries"
            value={loading ? '—' : summary.total}
            valueClass="text-blue-600"
            iconWrapClass="bg-blue-50"
            iconClass="text-blue-600"
          />
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-0 shadow-sm overflow-hidden">
          <StatCard
            icon={AlertCircle}
            label="Pending Queries"
            value={loading ? '—' : summary.pending}
            valueClass="text-orange-500"
            iconWrapClass="bg-orange-50"
            iconClass="text-orange-500"
          />
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-0 shadow-sm overflow-hidden">
          <StatCard
            icon={CheckCircle2}
            label="Solved Queries"
            value={loading ? '—' : summary.solved}
            valueClass="text-emerald-600"
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
          />
        </div>
      </div>

      {/* Query Inbox – same design as vendor, read-only */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Query Inbox</h2>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="text-sm font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Loading queries…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            No queries found.
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedTickets.map((t) => (
              <button
                key={`${t.orderId}-${t._id}`}
                type="button"
                onClick={() =>
                  router.push(`/system/tickets/${t.orderId}/${t._id}`)
                }
                className="w-full text-left rounded-2xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold shrink-0">
                          {t.customerName?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">
                          {t.customerName}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock3 className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        {formatRelativeTime(t.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {t.productName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.queryId}</p>
                    <p className="mt-2 text-xs sm:text-sm text-gray-700">
                      {t.message}
                    </p>
                    {t.assignedStore ? (
                      <p className="mt-2 text-xs text-blue-600 inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium">{t.assignedStore}</span>
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default AdminTickets;
