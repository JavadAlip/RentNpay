'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllVendors } from '../../../redux/slices/adminSlice';
import Link from 'next/link';
import { apiCreateVendorProfile } from '@/service/api';
import { toast } from 'react-toastify';

const AllVendors = () => {
  const dispatch = useDispatch();
  const { vendors, vendorsLoading, error } = useSelector((state) => state.admin);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    emailAddress: '',
    password: '',
  });

  useEffect(() => {
    dispatch(getAllVendors());
  }, [dispatch]);

  const filteredVendors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (vendors || []).filter((v) => {
      const matchSearch =
        !q ||
        String(v.fullName || '')
          .toLowerCase()
          .includes(q) ||
        String(v.emailAddress || '')
          .toLowerCase()
          .includes(q) ||
        String(v._id || '')
          .toLowerCase()
          .includes(q);
      if (!matchSearch) return false;
      if (activeFilter === 'kyc') return v.kycStatus !== 'approved';
      if (activeFilter === 'products') return Number(v.productsCount || 0) > 0;
      return true;
    });
  }, [vendors, query, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedVendors = filteredVendors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [query, activeFilter]);

  const stats = useMemo(() => {
    const list = vendors || [];
    return {
      totalVendors: list.length,
      pendingVerification: list.filter((v) => v.kycStatus !== 'approved').length,
      activeStores: list.filter((v) => Number(v.productsCount || 0) > 0).length,
    };
  }, [vendors]);

  if (vendorsLoading) {
    return (
      <div className="flex justify-center py-14">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
        {error}
      </div>
    );
  }

  const openCreate = () => {
    setForm({ fullName: '', emailAddress: '', password: '' });
    setCreateError('');
    setCreateOpen(true);
  };

  const submitCreateVendor = async (e) => {
    e.preventDefault();
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setCreateError('Please login again to continue.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await apiCreateVendorProfile(
        {
          fullName: form.fullName,
          emailAddress: form.emailAddress,
          password: form.password,
        },
        token,
      );
      toast.success(
        `Vendor created. Temporary password: ${res.data?.tempPassword || 'N/A'}`,
      );
      dispatch(getAllVendors());
      setForm({ fullName: '', emailAddress: '', password: '' });
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create vendor profile.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">All Partners & Vendors</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage vendor profiles, verification status, and inventory
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 self-end px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            + Create Vendor Profile
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <p className="text-[11px] text-gray-500">TOTAL VENDORS</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">
              {stats.totalVendors.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3">
            <p className="text-[11px] text-gray-500">PENDING VERIFICATION</p>
            <p className="text-3xl font-semibold text-rose-600 mt-1">
              {stats.pendingVerification.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <p className="text-[11px] text-gray-500">ACTIVE STORES</p>
            <p className="text-3xl font-semibold text-emerald-600 mt-1">
              {stats.activeStores.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col lg:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Name, Shop Name, or ID..."
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('kyc')}
              className={`px-4 py-2.5 rounded-xl border text-sm ${
                activeFilter === 'kyc'
                  ? 'border-orange-300 text-orange-600 bg-orange-50'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              KYC
            </button>
            <button
              onClick={() => setActiveFilter('products')}
              className={`px-4 py-2.5 rounded-xl border text-sm ${
                activeFilter === 'products'
                  ? 'border-orange-300 text-orange-600 bg-orange-50'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2.5 rounded-xl border text-sm ${
                activeFilter === 'all'
                  ? 'border-orange-300 text-orange-600 bg-orange-50'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Vendor Profile</th>
                <th className="px-4 py-3 text-left font-medium">Products</th>
                <th className="px-4 py-3 text-left font-medium">Domain / Vertical</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedVendors.map((v) => {
                const initials = String(v.fullName || 'V')
                  .split(' ')
                  .map((x) => x[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <tr key={v._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{v.fullName}</p>
                          <p className="text-xs text-gray-500">
                            #VEN-{String(v._id).slice(-3).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {(v.productsCount || 0).toLocaleString('en-IN')} Products
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {(v.productsCount || 0) > 0 ? 'Electronics' : 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{v.fullName}</p>
                      <p className="text-xs text-gray-500">{v.emailAddress}</p>
                      <span
                        className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] border ${
                          v.kycStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : v.kycStatus === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {v.kycStatus === 'approved'
                          ? 'Verified'
                          : v.kycStatus === 'rejected'
                            ? 'Rejected'
                            : 'Pending KYC'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/all-vendors/${v._id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {pagedVendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm">
          <p className="text-gray-500">
            Showing {(currentPage - 1) * pageSize + (pagedVendors.length ? 1 : 0)}-
            {(currentPage - 1) * pageSize + pagedVendors.length} of{' '}
            {filteredVendors.length.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{currentPage}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create Vendor Profile</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitCreateVendor} className="p-5 space-y-3">
              <input
                value={form.fullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Vendor full name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="email"
                value={form.emailAddress}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, emailAddress: e.target.value }))
                }
                placeholder="Vendor email"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="text"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Password (optional, auto-generated if empty)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />

              {createError ? (
                <p className="text-sm text-red-600">{createError}</p>
              ) : null}

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AllVendors;
