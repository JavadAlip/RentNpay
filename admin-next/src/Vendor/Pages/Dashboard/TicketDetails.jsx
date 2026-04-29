'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Box,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  User,
  MessageCircle,
  Home,
} from 'lucide-react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import basicInfoIcon from '@/assets/icons/basicInfo3.png';
import basicInfoIcon1 from '@/assets/icons/basicInfo4.png';

import {
  apiGetVendorTicketById,
  apiUpdateVendorTicketStatus,
} from '@/service/api';

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

const STATUS_OPTIONS = [
  { value: 'open', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function VendorTicketDetailsPage({ orderId, issueId }) {
  const router = useRouter();
  const { user, token } = useSelector((s) => s.vendor);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('open');

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
      const { data } = await apiGetVendorTicketById(
        orderId,
        issueId,
        authToken,
      );
      const nextTicket = data?.ticket || null;
      setTicket(nextTicket);
      setSelectedStatus(String(nextTicket?.vendorStatus || 'open'));
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Failed to load ticket details.',
      );
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [issueId, orderId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const canSave = useMemo(() => {
    if (!ticket) return false;
    return String(selectedStatus) !== String(ticket.vendorStatus || 'open');
  }, [selectedStatus, ticket]);

  const onSave = async () => {
    if (!ticket || !canSave) return;
    const authToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null);
    if (!authToken) return;
    setSaving(true);
    setError('');
    try {
      await apiUpdateVendorTicketStatus(
        orderId,
        issueId,
        selectedStatus,
        authToken,
      );
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f5f9] overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => router.push('/vendor/tickets')}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Queries
              </button>
              {ticket ? (
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="w-3.5 h-3.5" />
                    {formatRelativeTime(ticket.createdAt)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                    {ticket.status === 'solved' ? 'Solved' : 'Pending'}
                  </span>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              {loading ? (
                <div className="py-16 text-center text-sm text-gray-500">
                  Loading details...
                </div>
              ) : !ticket ? (
                <div className="py-16 text-center text-sm text-gray-500">
                  Ticket not found.
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-semibold text-gray-900">
                    {ticket.customerName}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Customer Query -{' '}
                    <span className="text-blue-600 font-semibold">
                      {ticket.queryId}
                    </span>
                  </p>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Query Information
                    </h2>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="w-10 h-10 rounded-lg bg-[#DBEAFE] inline-flex items-center justify-center shrink-0">
                            <Box className="w-5 h-5 text-blue-600" />
                          </span>

                          <div>
                            <p className="text-xs text-gray-500">Product</p>
                            <p className="mt-0.5 font-medium text-gray-900">
                              {ticket.productName}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-violet-500" />
                          Assigned Vendor
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                          {ticket.assignedStore || 'Rentnpay Support'}
                        </p>
                      </div> */}
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          {/* <span className="w-10 h-10 rounded-lg bg-[#EDE9FE] inline-flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-violet-600" />
                          </span> */}
                          <span className="w-10 h-10 rounded-lg bg-[#F3E8FF] inline-flex items-center justify-center shrink-0">
                            <img
                              src={basicInfoIcon.src}
                              alt="Assigned Vendor"
                              className="w-5 h-5 shrink-0"
                            />
                          </span>

                          <div>
                            <p className="text-xs text-gray-500">
                              Assigned Vendor
                            </p>
                            <p className="mt-0.5 font-medium text-gray-900">
                              {ticket.assignedStore || 'Rentnpay Support'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      {/* <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        Contact information
                      </p> */}
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <span className="w-8 h-8 rounded-lg bg-[#DCFCE7] inline-flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#10B981]" />
                        </span>
                        Contact information
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ticket.customerPhone ? (
                          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                            {ticket.customerPhone}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      {/* <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-amber-500" />
                        Visit Address
                      </p> */}
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <span className="w-8 h-8 rounded-lg bg-[#FFEDD4] inline-flex items-center justify-center">
                          <Home className="w-4 h-4 text-[#F97316]" />
                        </span>
                        Visit Address
                      </p>
                      <p className="mt-1 font-medium text-gray-900">
                        {ticket.address || 'Address unavailable'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Issue & Action Center
                    </h2>
                    <p className="mt-3 text-sm font-medium text-gray-800">
                      Customer Issue
                    </p>
                    <div className="mt-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#64748B] whitespace-pre-wrap">
                      {ticket.issueDescription || ticket.message}
                    </div>

                    <p className="mt-4 text-sm font-medium text-gray-800">
                      Update Query Status
                    </p>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="mt-2 w-full max-w-[320px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-300"
                    >
                      {STATUS_OPTIONS.map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onSave}
                        disabled={!canSave || saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStatus(
                            String(ticket.vendorStatus || 'open'),
                          )
                        }
                        className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3">
                      {/* <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-500" />
                        Customer
                      </p> */}
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <span className="w-8 h-8 rounded-lg bg-[#DBEAFE] inline-flex items-center justify-center">
                          <User className="w-4 h-4 text-[#2563EB]" />
                        </span>
                        Customer
                      </p>
                      <p className="mt-1.5 text-lg font-semibold text-[#2563EB]">
                        {ticket.customerName}
                      </p>
                      <p className="text-xs text-gray-500">Query Owner</p>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50/30 px-4 py-3">
                      {/* <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-violet-500" />
                        Query ID
                      </p> */}
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <span className="w-8 h-8 rounded-lg bg-[#F3E8FF] inline-flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-[#8B5CF6]" />
                        </span>
                        Query ID
                      </p>
                      <p className="mt-1.5 text-lg font-semibold text-[#8B5CF6]">
                        {ticket.queryId}
                      </p>
                      <p className="text-xs text-gray-500">Unique Identifier</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3">
                      {/* <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        Vendor
                      </p> */}
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <span className="w-8 h-8 rounded-lg bg-[#DCFCE7] inline-flex items-center justify-center">
                          <img
                            src={basicInfoIcon1.src}
                            alt="Vendor"
                            className="w-4 h-4 shrink-0"
                          />
                        </span>
                        Vendor
                      </p>
                      <p className="mt-1.5 text-lg font-semibold text-[#10B981]">
                        {ticket.assignedStore || 'Rentnpay Support'}
                      </p>
                      <p className="text-xs text-gray-500">Service Provider</p>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
