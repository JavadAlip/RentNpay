'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGetCustomerKycQueue } from '@/service/api';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import pendingIcon from '@/assets/icons/pending.png';
import verifiedIcon from '@/assets/icons/verified.png';
import rejectedIcon from '@/assets/icons/rejected.png';

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

export default function KycCustomerQueue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState({
    pending: [],
    approved: [],
    rejected: [],
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
    setError('');
    apiGetCustomerKycQueue(token)
      .then((res) => {
        setQueue(
          res.data?.queue || { pending: [], approved: [], rejected: [] },
        );
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || 'Failed to load customer KYC queue',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
    if (activeTab === 'pending') return queue.pending;
    if (activeTab === 'rejected') return queue.rejected;
    if (activeTab === 'approved') return queue.approved;
    return queue.pending;
  }, [queue, activeTab]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
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

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Customer KYC Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and verify customer identity documents
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`py-3 rounded-xl border text-left px-4 ${
                activeTab === 'pending'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
            >
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-base font-semibold text-gray-900">
                {queue.pending.length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('approved')}
              className={`py-3 rounded-xl border text-left px-4 sm:col-span-2 ${
                activeTab === 'approved'
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
            >
              <p className="text-xs text-gray-500">Verified</p>
              <p className="text-base font-semibold text-gray-900">
                {queue.approved.length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rejected')}
              className={`py-3 rounded-xl border text-left px-4 ${
                activeTab === 'rejected'
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
            >
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-base font-semibold text-gray-900">
                {queue.rejected.length}
              </p>
            </button>
          </div>
        </div> */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`py-3 rounded-xl border border-[#64748B] text-left px-4 ${
                activeTab === 'pending'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Image src={pendingIcon} alt="Pending" width={36} height={36} />
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <p className="text-base font-semibold text-[#64748B]">
                {queue.pending.length}
              </p>
            </button>
            {/* 
            <button
              type="button"
              onClick={() => setActiveTab('inReview')}
              className={`py-3 rounded-xl border text-left px-4 ${
                activeTab === 'inReview'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-500">In Review</p>
              </div>
              <p className="text-base font-semibold text-gray-900">
                {queue.inReview?.length || 0}
              </p>
            </button> */}

            <button
              type="button"
              onClick={() => setActiveTab('approved')}
              className={`py-3 rounded-xl border border-[#10B981] text-left px-4 ${
                activeTab === 'approved'
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Image
                  src={verifiedIcon}
                  alt="Verified"
                  width={36}
                  height={36}
                />
                <p className="text-xs text-gray-500">Verified</p>
              </div>
              <p className="text-base font-semibold text-[#10B981]">
                {queue.approved.length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rejected')}
              className={`py-3 rounded-xl border border-[#E7000B] text-left px-4 ${
                activeTab === 'rejected'
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-transparent bg-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Image
                  src={rejectedIcon}
                  alt="Rejected"
                  width={36}
                  height={36}
                />
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
              <p className="text-base font-semibold text-[#E7000B]">
                {queue.rejected.length}
              </p>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-500">
                  <th className="px-4 py-3 text-left font-medium">
                    CUSTOMER ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium">CUSTOMER</th>
                  <th className="px-4 py-3 text-left font-medium">ID TYPE</th>
                  <th className="px-4 py-3 text-left font-medium">DATE</th>
                  <th className="px-4 py-3 text-left font-medium">STATUS</th>

                  <th className="px-4 py-3 text-left font-medium">ACTION</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.userId} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                      {item.customerId || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.customerName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.idType}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDateTime(item.submittedAt)}
                    </td>
                    {/* <td className="px-4 py-3 text-gray-600 capitalize">
                      {item.status}
                    </td> */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'rejected'
                              ? 'bg-[#FFE2E2] text-[#E7000B]'
                              : item.status === 'pending'
                                ? 'bg-[#E5E7EB] text-[#64748B]'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.status === 'approved' ? 'Verified' : item.status}
                      </span>
                    </td>

                    {/* <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/kyc/customer/${item.userId}`)
                        }
                        className={`px-3 py-2 rounded-lg text-white text-xs font-medium ${
                          item.status === 'approved'
                            ? 'bg-slate-600 hover:bg-slate-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {item.status === 'approved' ? 'View details' : 'Review'}
                      </button>
                    </td> */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/kyc/customer/${item.userId}`)
                        }
                        className={`px-3 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 ${
                          item.status === 'approved'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {item.status === 'approved' ? (
                          'View details'
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No customer KYC records.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
