'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageSquare,
  MoveRight,
  Search,
  User,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { apiGetVendorTickets } from '@/service/api';

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

export default function VendorTicketsPage() {
  const PAGE_SIZE = 10;
  const router = useRouter();
  const { user, token } = useSelector((s) => s.vendor);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, solved: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
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
      const { data } = await apiGetVendorTickets(authToken);
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
      setError(err.response?.data?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [token]);

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
  }, [filtered, page, PAGE_SIZE]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="flex h-screen bg-[#f3f5f9] overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Customer Queries
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Issues reported from the renter &quot;Report an Issue&quot; flow
                appear here in real time.
              </p>
            </div>

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

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

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

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Query Inbox
                </h2>
                <button
                  type="button"
                  onClick={() => load()}
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
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
                  No queries match your filters yet. When a customer submits an
                  issue from My Rentals, it will show up here.
                </div>
              ) : (
                <ul className="space-y-4">
                  {paginatedTickets.map((t) => (
                    <li
                      key={`${t.orderId}-${t._id}`}
                      className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm cursor-pointer hover:border-orange-200 hover:shadow-md transition-all"
                      onClick={() => router.push(`/vendor/tickets/${t.orderId}/${t._id}`)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col items-start gap-1 text-sm text-gray-700">
                          <span className="inline-flex items-center gap-1.5 font-medium text-gray-900">
                            <User className="w-4 h-4 text-gray-400" />
                            {t.customerName}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatRelativeTime(t.createdAt)}
                          </span>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="mt-3">
                        <p className="font-semibold text-gray-900">
                          {t.productName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t.queryId}
                        </p>
                      </div>
                      <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
                        {t.message}
                      </div>
                      {t.assignedStore ? (
                        <p className="mt-3 text-xs text-blue-600 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Assigned to:{' '}
                            <span className="font-medium">
                              {t.assignedStore}
                            </span>
                          </span>
                        </p>
                      ) : null}
                      <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-600">
                        View details
                        <MoveRight className="w-3.5 h-3.5" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && filtered.length > 0 ? (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    Showing {(page - 1) * PAGE_SIZE + 1}-
                    {Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
                    {filtered.length} queries
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600 min-w-[72px] text-center">
                      Page {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
