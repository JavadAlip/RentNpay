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

  const sectionedDocs = useMemo(() => {
    if (!kyc) {
      return {
        proprietor: [],
        identity: [],
        business: [],
        store: [],
        bank: [],
      };
    }
    const globalStatus = String(kyc.status || 'pending').toLowerCase();
    const dr = kyc.documentReviews && typeof kyc.documentReviews === 'object' ? kyc.documentReviews : {};

    const mk = (docKey, title, fileOk) => {
      const rev = dr[docKey];
      if (globalStatus === 'approved') {
        return { docKey, title, ok: fileOk, tone: 'verified', message: '', showReupload: false };
      }
      if (rev?.status === 'reupload_requested') {
        return {
          docKey,
          title,
          ok: fileOk,
          tone: 'rejected',
          message:
            rev.comment ||
            'Please upload a clearer document for verification.',
          showReupload: true,
        };
      }
      if (globalStatus === 'rejected') {
        return {
          docKey,
          title,
          ok: fileOk,
          tone: 'rejected',
          message:
            kyc.rejectionReason ||
            kyc.adminComment ||
            'Please update your KYC as requested.',
          showReupload: true,
        };
      }
      return {
        docKey,
        title,
        ok: fileOk,
        tone: 'pending',
        message: '',
        showReupload: false,
      };
    };

    const stores = Array.isArray(kyc.storeManagement?.stores)
      ? kyc.storeManagement.stores
      : [];
    const storeRows = stores.length
      ? stores.map((st, i) =>
          mk(
            `storeFront_${i}`,
            `Store front — ${st.storeName || `Store ${i + 1}`}`,
            Boolean(st.shopFrontPhotoUrl),
          ),
        )
      : [
          mk(
            'storeFront_0',
            'Store front photo',
            Boolean(stores[0]?.shopFrontPhotoUrl),
          ),
        ];

    return {
      proprietor: [mk('profile', "Owner's Photo", Boolean(kyc.ownerPhoto))],
      identity: [
        mk('pan', 'PAN Card', Boolean(kyc.panPhoto) && Boolean(kyc.panNumber)),
        mk(
          'aadhaarFront',
          'Aadhaar Card (Front)',
          Boolean(kyc.aadhaarFront) && Boolean(kyc.aadhaarNumber),
        ),
        mk('aadhaarBack', 'Aadhaar Card (Back)', Boolean(kyc.aadhaarBack)),
      ],
      business: [
        mk('shopAct', 'Shop Act License', Boolean(kyc.businessDetails?.shopActLicense)),
        mk('gst', 'GST Certificate', Boolean(kyc.businessDetails?.gstCertificate)),
      ],
      store: storeRows,
      bank: [mk('bank', 'Cancelled Cheque', Boolean(kyc.bankDetails?.cancelledCheque))],
    };
  }, [kyc]);

  const status = kyc?.status || 'pending';
  const allDocs = [
    ...sectionedDocs.proprietor,
    ...sectionedDocs.identity,
    ...sectionedDocs.business,
    ...sectionedDocs.store,
    ...sectionedDocs.bank,
  ];
  const totalDocs = allDocs.length || 1;
  const okDocs = allDocs.filter((d) => d.ok).length;
  const progressPct = Math.round((okDocs / totalDocs) * 100);

  const docReviews = kyc?.documentReviews && typeof kyc.documentReviews === 'object' ? kyc.documentReviews : {};
  const anyReuploadRequested = Object.values(docReviews).some(
    (r) => r?.status === 'reupload_requested',
  );
  const actionRequired = status === 'rejected' || anyReuploadRequested;
  const pending = status === 'pending';
  const verified = status === 'approved';
  const rejectedCount = allDocs.filter((d) => d.tone === 'rejected').length;
  const pendingCount = allDocs.filter((d) => d.tone === 'pending').length;

  const DocRow = ({ item }) => {
    if (!item) return null;
    return (
      <div className="rounded-xl border border-gray-200 px-4 py-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{item.title || item.docKey}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {item.tone === 'verified'
            ? 'Document verified successfully'
            : item.tone === 'rejected'
              ? 'Document needs re-upload'
              : 'Being reviewed by our verification team'}
        </p>
        {item.tone === 'rejected' && item.message ? (
          <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 max-w-xl">
            <p className="font-semibold">Reason for Rejection:</p>
            <p className="mt-0.5">{item.message}</p>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {item.showReupload ? (
          <a
            href="/vendor-kyc-verification"
            className="px-3 py-2 rounded-lg border border-orange-300 text-orange-700 text-xs font-medium hover:bg-orange-50 whitespace-nowrap"
          >
            Choose New File
          </a>
        ) : null}
        <span className={`px-2.5 py-1 rounded-full border text-xs ${badge(item.tone)}`}>
          {item.tone === 'verified'
            ? 'Verified'
            : item.tone === 'rejected'
              ? 'Rejected'
              : 'Under Review'}
        </span>
      </div>
    </div>
    );
  };

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
            ) : !kyc ? (
              <div className="p-6 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl">
                KYC not found.
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
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
                            ? anyReuploadRequested
                              ? 'Admin requested a clearer upload for one or more documents. See the reasons below.'
                              : kyc?.rejectionReason ||
                                kyc?.adminComment ||
                                'Some documents need to be re-uploaded.'
                            : verified
                              ? 'Your KYC has been approved. You can now create products.'
                              : 'Submitted and waiting for admin review.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-5 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Verified</p>
                        <p className="font-semibold text-emerald-600">
                          {verified ? totalDocs : okDocs}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Pending</p>
                        <p className="font-semibold text-amber-600">
                          {pending ? pendingCount || totalDocs : pendingCount}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Rejected</p>
                        <p className="font-semibold text-rose-600">
                          {actionRequired ? Math.max(1, rejectedCount) : rejectedCount}
                        </p>
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
                    <DocRow item={sectionedDocs.proprietor[0]} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">Identity Proof</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {sectionedDocs.identity.map((d) => (
                      <DocRow key={d.title} item={d} />
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">Business Documents</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {sectionedDocs.business.map((d) => (
                      <DocRow key={d.title} item={d} />
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">Store Photos</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {sectionedDocs.store.map((d) => (
                      <DocRow key={d.docKey} item={d} />
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">Bank Details</p>
                  </div>
                  <div className="p-4">
                    <DocRow item={sectionedDocs.bank[0]} />
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

