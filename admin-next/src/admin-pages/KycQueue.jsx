'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGetVendorKycQueue } from '@/service/api';
import {
  ArrowUpDown,
  MapPin,
  TriangleAlert,
  Calendar,
  CheckCircle2,
  Eye,
} from 'lucide-react';

const formatDateTime = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// const riskBadgeClass = (risk) => {
//   if (risk === 'Clean')
//     return 'bg-emerald-50 text-emerald-700 border-emerald-200';
//   if (risk.startsWith('Rejected:'))
//     return 'bg-rose-50 text-rose-700 border-rose-200';
//   if (risk.toLowerCase().includes('missing')) {
//     return 'bg-rose-50 text-rose-700 border-rose-200';
//   }
//   return 'bg-amber-50 text-amber-700 border-amber-200';
// };

const riskBadgeClass = (risk) => {
  if (risk === 'Clean') {
    return {
      wrapper: 'bg-[#DCFCE7] text-[#008236] border-[#7BF1A8]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#008236]" />,
    };
  }

  if (risk.startsWith('Rejected:'))
    return {
      wrapper: 'bg-[#FFE2E2] text-[#C10007] border-[#FFA2A2]',
      icon: null,
    };

  if (risk.toLowerCase().includes('missing')) {
    return {
      wrapper: 'bg-[#FFE2E2] text-[#C10007] border-[#FFA2A2]',
      icon: null,
    };
  }

  return {
    wrapper: 'bg-[#FEF3C6] text-[#BB4D00] border-[#FFD230]',
    icon: null,
  };
};
export default function KycQueue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState({
    pending: [],
    resubmitted: [],
    approved: [],
    rejected: [],
  });
  const [metrics, setMetrics] = useState({
    avgReviewTimeMins: 0,
    approvalRate: 0,
  });
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGetVendorKycQueue(token)
      .then((res) => {
        setQueue(
          res.data?.queue || {
            pending: [],
            resubmitted: [],
            approved: [],
            rejected: [],
          },
        );
        setMetrics(
          res.data?.metrics || { avgReviewTimeMins: 0, approvalRate: 0 },
        );
      })
      .catch((err) =>
        setError(err.response?.data?.message || 'Failed to load KYC queue'),
      )
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
    if (activeTab === 'pending') return queue.pending;
    if (activeTab === 'resubmitted') return queue.resubmitted;
    if (activeTab === 'rejected') return queue.rejected;
    if (activeTab === 'approved') return queue.approved;
    return queue.pending;
  }, [queue, activeTab]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Onboarding Queue
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vendor verification & risk assessment workflow
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 px-4 py-2 text-start min-w-[140px]">
            <p className="text-[11px] text-gray-500">Avg. Review Time</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">
              {metrics.avgReviewTimeMins} mins
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 px-4 py-2 text-start min-w-[140px]">
            <p className="text-[11px] text-gray-500">Approval Rate</p>
            <p className="text-lg font-semibold text-[#00A63E] mt-0.5">
              {metrics.approvalRate}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              className={`py-3 rounded-xl border text-left px-4 ${
                activeTab === 'pending'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('pending')}
              type="button"
            >
              <p className="text-xs text-gray-500">Pending Review</p>
              <p className="text-base font-semibold text-gray-900">
                {queue.pending.length}
              </p>
            </button>
            <button
              className={`py-3 rounded-xl border text-left px-4 ${
                activeTab === 'resubmitted'
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('resubmitted')}
              type="button"
            >
              <p className="text-xs text-gray-500">Resubmitted</p>
              <p className="text-base font-semibold text-gray-900">
                {queue.resubmitted.length}
              </p>
            </button>
            <button
              className={`py-3 rounded-xl border text-left px-4 ${
                activeTab === 'rejected'
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('rejected')}
              type="button"
            >
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-base font-semibold text-gray-900">
                {queue.rejected.length}
              </p>
            </button>
            <button
              className={`py-3 rounded-xl border text-left px-4 ${
                activeTab === 'approved'
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('approved')}
              type="button"
            >
              <p className="text-xs text-gray-500">Verified</p>
              <p className="text-base font-semibold text-gray-900">
                {queue.approved.length}
              </p>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600 bg-red-50 border-t border-red-200">
            {error}
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl border border-gray-200 px-3 py-2">
                <p className="text-[11px] text-gray-500">Sort By</p>
                <select className="w-full outline-none text-sm bg-transparent mt-1">
                  <option>Newest</option>
                </select>
              </div>
              <div className="rounded-xl border border-gray-200 px-3 py-2 md:col-span-2">
                <p className="text-[11px] text-gray-500">City</p>
                <select className="w-full outline-none text-sm bg-transparent mt-1">
                  <option>All</option>
                </select>
              </div>
              <div className="rounded-xl border border-gray-200 px-3 py-2">
                <p className="text-[11px] text-gray-500">Risk</p>
                <select className="w-full outline-none text-sm bg-transparent mt-1">
                  <option>All</option>
                </select>
              </div>
            </div> */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              {/* Sort By */}
              <div className="flex items-center justify-between w-full md:w-1/3 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                {/* Left: Icon + Title */}
                <div className="flex items-center gap-2 text-gray-600">
                  <ArrowUpDown className="w-4 h-4" />
                  <p className="text-sm font-medium">Sort By</p>
                </div>

                {/* Right: Dropdown */}
                <select className="outline-none text-sm bg-transparent">
                  <option>Newest</option>
                  <option>Oldest</option>
                </select>
              </div>

              {/* City */}
              <div className="flex items-center justify-between w-full md:w-1/3 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <p className="text-sm font-medium">City</p>
                </div>

                <select className="outline-none text-sm bg-transparent">
                  <option>All</option>
                  <option>Calicut</option>
                  <option>Kochi</option>
                </select>
              </div>

              {/* Risk */}
              <div className="flex items-center justify-between w-full md:w-1/3 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                <div className="flex items-center gap-2 text-gray-600">
                  <TriangleAlert className="w-4 h-4" />
                  <p className="text-sm font-medium">Risk</p>
                </div>

                <select className="outline-none text-sm bg-transparent">
                  <option>All</option>
                  <option>Clean</option>
                  <option>Missing Docs</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-500">
                    <th className="px-4 py-3 text-left font-medium">DATE</th>
                    <th className="px-4 py-3 text-left font-medium">
                      VENDOR NAME
                    </th>
                    <th className="px-4 py-3 text-left font-medium">TYPE</th>
                    <th className="px-4 py-3 text-left font-medium">
                      RISK FACTORS
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      SLA TIMER
                    </th>
                    <th className="px-4 py-3 text-left font-medium">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.vendorId}
                      className="border-t border-gray-100"
                    >
                      {/* <td className="px-4 py-3 text-gray-700">
                        {formatDateTime(item.submittedAt)}
                      </td> */}
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDateTime(item.submittedAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.vendorName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.type}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {(item.riskFactors || []).slice(0, 2).map((r) => {
                            const riskStyle = riskBadgeClass(r);

                            return (
                              <span
                                key={r}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${riskStyle.wrapper}`}
                              >
                                {riskStyle.icon}
                                {r}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.dueIn}</td>
                      <td className="px-4 py-3">
                        {item.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/kyc/vendor/${item.vendorId}`)
                            }
                            className="px-3 py-2 rounded-lg bg-[#3B82F6] text-white text-xs font-medium hover:bg-blue-700 flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review now
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/kyc/vendor/${item.vendorId}`)
                            }
                            className="px-3 py-2 rounded-lg bg-white flex items-center gap-1.5 text-[#3B82F6] text-xs font-medium border-2 border-[#3B82F6] "
                          >
                            <Eye className="w-3.5 h-3.5" />
                            review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!items.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No KYC records in this tab.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
