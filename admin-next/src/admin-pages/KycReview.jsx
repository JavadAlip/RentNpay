'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  apiGetVendorKycReview,
  apiRequestVendorKycDocumentReupload,
  apiReviewVendorKyc,
} from '@/service/api';

const categoryBadge = (category) => {
  if (category === 'bank') return 'Bank Proof';
  if (category === 'shop') return 'Shop';
  if (category === 'business') return 'Business';
  return 'Identity';
};

export default function KycReview({ vendorId: vendorIdProp }) {
  const params = useParams();
  const vendorId = vendorIdProp || params?.vendorId || params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kyc, setKyc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [comment, setComment] = useState('');
  const [shopNameMatch, setShopNameMatch] = useState(null);
  const [addressMatch, setAddressMatch] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotate, setRotate] = useState(0);
  const [brightness, setBrightness] = useState(100);

  // Match Figma behavior: after approval, show modal and auto-redirect.
  useEffect(() => {
    if (!successOpen) return;
    const t = setTimeout(() => {
      router.push('/kyc/vendor');
    }, 2500);
    return () => clearTimeout(t);
  }, [successOpen, router]);

  const refreshKyc = useCallback(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token || !vendorId) return Promise.resolve();
    return apiGetVendorKycReview(vendorId, token)
      .then((res) => {
        const k = res.data?.kyc || null;
        setKyc(k);
        const docs = Array.isArray(k?.documents) ? k.documents : [];
        setDocuments(docs);
        setActiveIdx(0);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load KYC review.');
      });
  }, [vendorId]);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    if (!vendorId) {
      setError('Invalid vendor id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    refreshKyc().finally(() => setLoading(false));
  }, [vendorId, refreshKyc]);

  const activeDoc = documents[activeIdx] || null;
  const activeSrc = activeDoc?.src || '';

  useEffect(() => {
    setZoom(100);
    setRotate(0);
    setBrightness(100);
  }, [activeIdx, activeSrc]);

  const defaultStore = kyc?.storeManagement?.stores?.find((s) => s.isDefault) ||
    kyc?.storeManagement?.stores?.[0];
  const gpsNote =
    defaultStore?.mapLat != null && defaultStore?.mapLng != null
      ? `Store pin: ${Number(defaultStore.mapLat).toFixed(4)}, ${Number(defaultStore.mapLng).toFixed(4)}`
      : 'Distance from Shop GPS: — (no pin saved)';

  const canApprove = shopNameMatch === true && addressMatch === true;

  const handleRequestReupload = async () => {
    if (!kyc?.vendorId || !activeDoc?.key) return;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;
    const explicitMsg = comment?.trim();

    // If admin didn't type a custom comment, auto-generate a clear reason
    // based on the Yes/No checks selected in the right panel.
    let msg = explicitMsg;
    if (!msg) {
      const docCategory = activeDoc?.category;
      const shopMismatch =
        shopNameMatch === false && (docCategory === 'shop' || docCategory === 'business');
      const addressMismatch =
        addressMatch === false &&
        (docCategory === 'identity' ||
          String(activeDoc.key).startsWith('aadhaar'));

      const parts = [];
      if (shopMismatch) {
        parts.push('Please check shop name: it does not match the document.');
      }
      if (addressMismatch) {
        parts.push('Please check address: it does not match the Aadhaar/document.');
      }

      // Fallbacks when category doesn't align perfectly.
      if (!parts.length && shopNameMatch === false) {
        parts.push('Please check shop name: it does not match the document.');
      }
      if (!parts.length && addressMatch === false) {
        parts.push('Please check address: it does not match the Aadhaar/document.');
      }
      if (!parts.length) {
        parts.push('Please upload a clear, well-lit re-upload for verification.');
      }

      msg = parts.join(' ');
    }

    setSubmitting(true);
    setError('');
    try {
      await apiRequestVendorKycDocumentReupload(
        String(kyc.vendorId),
        { documentKey: activeDoc.key, comment: msg },
        token,
      );
      setComment('');
      await refreshKyc();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to request re-upload.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!kyc?.vendorId) return;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;
    if (!canApprove) {
      setError('Select Yes for both shop name and address before approving.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiReviewVendorKyc(
        String(kyc.vendorId),
        { status: 'approved', comment: comment?.trim() || '' },
        token,
      );
      setSuccessOpen(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to approve KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  const docSelectOptions = useMemo(
    () =>
      documents.map((d, i) => ({
        value: i,
        label: d.label,
      })),
    [documents],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !kyc) {
    return (
      <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
        {error}
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="p-6 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl">
        KYC not found.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Review Vendor KYC</h1>
        <p className="text-sm text-gray-500 mt-1">
          {kyc.vendorName} • {kyc.vendorEmail}
        </p>
      </div>

      {error && kyc ? (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 min-h-[520px]">
        <div className="xl:col-span-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-100 flex flex-col">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Document Viewer</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review uploaded documents for verification.
              </p>
            </div>
            <div className="min-w-[200px]">
              <label className="text-[10px] uppercase tracking-wide text-slate-500 block mb-1">
                Document
              </label>
              <select
                className="w-full rounded-lg bg-slate-800 border border-slate-600 text-sm text-white px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/40"
                value={documents.length ? activeIdx : 0}
                onChange={(e) => setActiveIdx(Number(e.target.value))}
              >
                {docSelectOptions.length ? (
                  docSelectOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))
                ) : (
                  <option value={0}>No documents</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex-1 relative flex flex-col min-h-[360px]">
            <div className="flex-1 flex items-center justify-center p-4 bg-slate-950/80">
              {activeDoc ? (
                <span className="absolute top-3 left-3 z-10 text-[10px] font-medium px-2 py-1 rounded-md bg-slate-800/90 border border-slate-600 text-slate-200">
                  {categoryBadge(activeDoc.category)}
                </span>
              ) : null}
              {activeSrc ? (
                <img
                  src={activeSrc}
                  alt={activeDoc?.label || 'Document'}
                  className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotate}deg)`,
                    filter: `brightness(${brightness}%)`,
                    transition: 'transform 0.15s ease',
                  }}
                />
              ) : (
                <p className="text-sm text-slate-500 px-6 text-center">
                  No file for this slot yet (vendor may only have saved a filename). Ask for
                  re-upload or check another document.
                </p>
              )}
            </div>
            <div className="border-t border-slate-700 bg-slate-900 px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                className="px-2 py-1 rounded-md bg-slate-800 border border-slate-600 hover:bg-slate-700"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
              >
                −
              </button>
              <span className="text-slate-300 w-12 text-center">{zoom}%</span>
              <button
                type="button"
                className="px-2 py-1 rounded-md bg-slate-800 border border-slate-600 hover:bg-slate-700"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
              >
                +
              </button>
              <button
                type="button"
                className="ml-2 px-2 py-1 rounded-md bg-slate-800 border border-slate-600 hover:bg-slate-700"
                onClick={() => setRotate((r) => (r + 90) % 360)}
              >
                Rotate
              </button>
              <label className="ml-2 flex items-center gap-2 text-slate-400">
                <span className="hidden sm:inline">Brightness</span>
                <input
                  type="range"
                  min={60}
                  max={140}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-24 accent-orange-500"
                />
              </label>
              <div className="flex-1" />
              <button
                type="button"
                disabled={activeIdx <= 0}
                className="px-2 py-1 rounded-md bg-slate-800 border border-slate-600 disabled:opacity-40"
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              >
                ‹ Prev
              </button>
              <span className="text-slate-400 px-2">
                {documents.length ? `${activeIdx + 1}/${documents.length}` : '0/0'}
              </span>
              <button
                type="button"
                disabled={activeIdx >= documents.length - 1}
                className="px-2 py-1 rounded-md bg-slate-800 border border-slate-600 disabled:opacity-40"
                onClick={() =>
                  setActiveIdx((i) => Math.min(documents.length - 1, i + 1))
                }
              >
                Next ›
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Verify Data Points</h2>
              <p className="text-xs text-gray-500">Vendor: {kyc.shopNameForVerification || kyc.vendorName}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Shop name input</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {kyc.shopNameForVerification || '—'}
              </p>
              <p className="text-[11px] text-gray-500 mt-3">Does name match document?</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShopNameMatch(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                    shopNameMatch === true
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setShopNameMatch(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                    shopNameMatch === false
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Address input</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 line-clamp-3">
                {kyc.permanentAddress || '—'}
              </p>
              <p className="text-[11px] text-gray-500 mt-3">Does address match document?</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAddressMatch(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                    addressMatch === true
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setAddressMatch(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                    addressMatch === false
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  No
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800">
                <p className="font-medium">Location note</p>
                <p className="mt-0.5 text-emerald-700">{gpsNote}</p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              <p className="font-semibold">Verification in progress</p>
              <p className="text-blue-800/90 mt-0.5">
                Complete checks and approve, or request re-upload for the selected document with
                a clear reason.
              </p>
            </div>

            <div>
              <p className="text-[11px] text-gray-500 mb-1">
                Comment / reason (shown to vendor on re-upload request)
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe any issues or reasons for requesting re-upload..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleRequestReupload}
              disabled={submitting || !activeDoc}
              className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              Request re-upload (this document)
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting || !canApprove}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Approve vendor
            </button>
            <p className="text-[11px] text-gray-500 text-center">
              Status: <span className="font-semibold capitalize">{kyc.status}</span>
              {activeDoc?.review?.status === 'reupload_requested' ? (
                <span className="ml-2 text-amber-700">• Re-upload requested for current doc</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {successOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[560px] rounded-[22px] bg-white border border-gray-100 shadow-2xl p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="#059669"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-gray-900">
                Vendor Activated!
              </h3>

              <p className="mt-2 text-base text-gray-600">
                <span className="font-medium text-emerald-700">
                  {kyc?.vendorName || 'Vendor'}
                </span>{' '}
                is now live on Rentnpay
              </p>

              <div className="mt-6 w-full rounded-xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-left">
                <ul className="space-y-3 text-sm text-emerald-900">
                  <li className="flex items-start gap-3">
                    <span className="mt-[2px] w-5 h-5 rounded-full bg-white border border-emerald-200 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="#059669"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>Vendor can now list products</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-[2px] w-5 h-5 rounded-full bg-white border border-emerald-200 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="#059669"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>Welcome email sent</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-[2px] w-5 h-5 rounded-full bg-white border border-emerald-200 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="#059669"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>Profile is visible to customers</span>
                  </li>
                </ul>
              </div>

              <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
                <span className="text-gray-400">→</span> Redirecting to Queue...
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
