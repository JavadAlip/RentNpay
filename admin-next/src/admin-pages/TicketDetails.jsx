'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Building2,
  Clock3,
  MapPin,
  Phone,
  User,
  MessageCircle,
} from 'lucide-react';
import { apiAdminGetTicketById } from '@/service/api';

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

const AdminTicketDetails = ({ orderId, issueId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);

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
      const { data } = await apiAdminGetTicketById(orderId, issueId, token);
      setTicket(data?.ticket || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load ticket details.');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, issueId]);

  useEffect(() => {
    load();
  }, [load]);

  const statusLabel = useMemo(() => {
    if (!ticket) return '';
    const s = String(ticket.vendorStatus || 'open').toLowerCase();
    if (s === 'resolved') return 'Resolved';
    if (s === 'in_progress') return 'In Progress';
    return 'Pending';
  }, [ticket]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/system/tickets')}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Tickets
        </button>
        {ticket ? (
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="w-3.5 h-3.5" />
              {formatRelativeTime(ticket.createdAt)}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
              {statusLabel}
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
              Customer Query –{' '}
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
                  <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-blue-500" />
                    Product
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {ticket.productName}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-violet-500" />
                    Assigned Vendor
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {ticket.assignedStore || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-500" />
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
                <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
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
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.issueDescription || ticket.message}
              </div>

              <p className="mt-4 text-sm font-medium text-gray-800">
                Current Query Status
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {statusLabel}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3">
                <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-500" />
                  Customer
                </p>
                <p className="mt-1.5 text-lg font-semibold text-blue-700">
                  {ticket.customerName}
                </p>
                <p className="text-xs text-gray-500">Query Owner</p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/30 px-4 py-3">
                <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-violet-500" />
                  Query ID
                </p>
                <p className="mt-1.5 text-lg font-semibold text-violet-700">
                  {ticket.queryId}
                </p>
                <p className="text-xs text-gray-500">Unique Identifier</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3">
                <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  Vendor
                </p>
                <p className="mt-1.5 text-lg font-semibold text-emerald-700">
                  {ticket.assignedStore || 'Rentnpay Support'}
                </p>
                <p className="text-xs text-gray-500">Service Provider</p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AdminTicketDetails;

