'use client';

import { useEffect, useMemo, useState } from 'react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { apiGetMyVendorKyc } from '@/service/api';

const badge = (tone) => {
  if (tone === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (tone === 'pending') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (tone === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

export default function VendorKycStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kyc, setKyc] = useState(null);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }

    setLoading(true);
    apiGetMyVendorKyc(token)
      .then((res) => setKyc(res.data?.kyc || null))
      .catch((err) =>
        setError(err.response?.data?.message || 'Failed to load KYC status.'),
      )
      .finally(() => setLoading(false));
  }, []);

  const docs = useMemo(() => {
    const ownerPhoto = Boolean(kyc?.ownerPhoto);
    const pan = Boolean(kyc?.panPhoto) && Boolean(kyc?.panNumber);
    const aFront = Boolean(kyc?.aadhaarFront) && Boolean(kyc?.aadhaarNumber);
    const aBack = Boolean(kyc?.aadhaarBack);

    const items = [
      {
        title: "Owner's Photo",
        ok: ownerPhoto,
      },
      {
        title: 'PAN Card',
        ok: pan,
      },
      {
        title: 'Aadhaar Card (Front)',
        ok: aFront,
      },
      {
        title: 'Aadhaar Card (Back)',
        ok: aBack,
      },
    ];

    return items;
  }, [kyc]);

  const status = kyc?.status || 'pending';
  const totalDocs = docs.length || 1;
  const okDocs = docs.filter((d) => d.ok).length;
  const progressPct = Math.round((okDocs / totalDocs) * 100);

  const actionRequired = status === 'rejected';
  const pending = status === 'pending';
  const verified = status === 'approved';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f3f5f9]">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  KYC Verification Status
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Application ID: {kyc?._id ? `VND-${String(kyc._id).slice(-6).toUpperCase()}` : '—'}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Refresh Status
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${actionRequired ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-lg">!</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {actionRequired
                            ? 'Action Required'
                            : verified
                              ? 'Verified'
                              : pending
                                ? 'Under Review'
                                : 'Status'}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {actionRequired
                            ? (kyc?.rejectionReason || kyc?.adminComment || 'Some documents need to be re-uploaded.')
                            : verified
                              ? 'Your KYC has been approved. You can now create products.'
                              : 'Submitted and waiting for admin review.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Verified</p>
                        <p className="font-semibold text-emerald-600">{verified ? okDocs : 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Pending</p>
                        <p className="font-semibold text-amber-600">{pending ? totalDocs : 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Rejected</p>
                        <p className="font-semibold text-rose-600">{actionRequired ? 1 : 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Overall Progress</span>
                      <span>
                        {okDocs} / {totalDocs} Documents
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">Proprietor Details</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Owner&apos;s Photo</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {docs[0]?.ok ? 'Document verified successfully' : 'Awaiting document review'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full border text-xs ${docs[0]?.ok ? badge('verified') : badge(actionRequired ? 'rejected' : 'pending')}`}>
                        {docs[0]?.ok ? 'Verified' : actionRequired ? 'Rejected' : 'Under Review'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">Identity Proof</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {docs.slice(1).map((d) => (
                      <div key={d.title} className="rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{d.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {d.ok ? 'Document verified successfully' : 'Awaiting document review'}
                          </p>
                          {actionRequired ? (
                            <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                              <p className="font-semibold">Reason for Rejection:</p>
                              <p className="mt-0.5">
                                {kyc?.rejectionReason || kyc?.adminComment || 'Please re-upload a clear document.'}
                              </p>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {actionRequired ? (
                            <a
                              href="/vendor-kyc-verification"
                              className="px-3 py-2 rounded-lg border border-orange-300 text-orange-700 text-xs font-medium hover:bg-orange-50"
                            >
                              Choose New File
                            </a>
                          ) : null}
                          <span className={`px-2.5 py-1 rounded-full border text-xs ${d.ok ? badge('verified') : badge(actionRequired ? 'rejected' : 'pending')}`}>
                            {d.ok ? 'Verified' : actionRequired ? 'Rejected' : 'Under Review'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="font-semibold text-gray-900">Need Help?</p>
                  <p className="text-sm text-gray-600 mt-1">
                    If you have questions about document uploads, please contact support.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
                      Chat with Support
                    </button>
                    <button className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 text-sm">
                      View KYC Guide
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

