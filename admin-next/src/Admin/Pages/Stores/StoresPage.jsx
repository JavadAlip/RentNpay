'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { apiGetAdminStores } from '@/service/api';
import physicalStoreIcon from '@/assets/icons/physical-store.png';
import storeRowIcon from '@/assets/icons/store.png';

const PAGE_SIZE = 10;

const StoresPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stores, setStores] = useState([]);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('all');
  const [city, setCity] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    apiGetAdminStores(token)
      .then((res) => {
        if (!mounted) return;
        setStores(Array.isArray(res.data?.stores) ? res.data.stores : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Failed to load stores.');
        setStores([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const cities = useMemo(
    () =>
      [...new Set(stores.map((s) => s.city))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [stores],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((s) => {
      const byMode =
        mode === 'all' ||
        (mode === 'online' && s.radius === 'Pan-India') ||
        (mode === 'offline' && s.radius !== 'Pan-India');
      const byCity = city === 'all' || s.city === city;
      const byQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.vendor.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.pin.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      return byMode && byCity && byQuery;
    });
  }, [stores, mode, city, query]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const counts = useMemo(() => {
    const total = stores.length;
    const active = stores.filter((s) => s.status === 'enabled').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [stores]);

  return (
    <div className="min-h-full bg-[#f2f4f8] -m-3 sm:-m-4 md:-m-6 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Image
              src={physicalStoreIcon}
              alt=""
              width={72}
              height={72}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                All Physical Stores &amp; Warehouses
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage store visibility, service radius, and operational status
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Total Stores
              </p>
              <p className="text-4xl font-bold text-slate-900 mt-1">
                {counts.total}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Active Stores
              </p>
              <p className="text-4xl font-bold text-[#10B981] mt-1">
                {counts.active}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Inactive Stores
              </p>
              <p className="text-4xl font-bold text-[#64748B] mt-1">
                {counts.inactive}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <label className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by Name, Shop"
                className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white pl-9 pr-9 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="all">Online / Offline / Both</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </label>

            <label className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white pl-9 pr-9 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="all">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </label>

            <label className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by Pincode, City, or Store Name"
                className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div>
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Store Info</th>
                  <th className="text-left px-4 py-3">Parent Vendor</th>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="text-left px-4 py-3">Service Radius</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12">
                      <div className="flex justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      No stores found.
                    </td>
                  </tr>
                ) : (
                  paged.map((s) => (
                    <tr key={s.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Image
                            src={storeRowIcon}
                            alt=""
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-lg object-contain shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-500">#{s.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-blue-700 font-medium">{s.vendor}</p>
                        <p className="text-xs text-gray-500">#{s.vendorId}</p>
                      </td>
                      <td className="px-4 py-3">
                      <p className="text-slate-900 inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {s.city}
                      </p>
                        <p className="text-xs text-gray-500">PIN: {s.pin}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-300 px-3 py-1.5 text-xs font-semibold shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]">
                          <MapPin className="w-3 h-3" />
                          {s.radius}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                      <span
                        className={`inline-flex w-12 h-7 rounded-full border transition-colors ${
                          s.status === 'enabled'
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'bg-gray-200 border-gray-200'
                        }`}
                        aria-hidden
                      >
                        <span
                          className={`m-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            s.status === 'enabled' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <div>
                        <span
                          className={`text-xs font-semibold ${
                            s.status === 'enabled' ? 'text-emerald-600' : 'text-gray-500'
                          }`}
                        >
                          {s.status === 'enabled' ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                        {s.status === 'disabled' ? (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Disabled by Admin
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Edit store"
                            className="w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 inline-flex items-center justify-center hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete store"
                            className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-500 inline-flex items-center justify-center hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{' '}
              Stores
            </p>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40"
                disabled={page === 1}
              >
                <span className="inline-flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </span>
              </button>
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-semibold inline-flex items-center justify-center">
                {page}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40"
                disabled={page === totalPages}
              >
                <span className="inline-flex items-center gap-1">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoresPage;
