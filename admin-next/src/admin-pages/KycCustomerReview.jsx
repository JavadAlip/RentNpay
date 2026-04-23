'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  Hash,
  MapPin,
  Phone,
  Search,
  User,
  X,
} from 'lucide-react';
import { apiGetCustomerKycReview, apiReviewCustomerKyc } from '@/service/api';

const getTone = (status) => {
  if (status === 'approved')
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'rejected') return 'text-rose-700 bg-rose-50 border-rose-200';
  return 'text-amber-700 bg-amber-50 border-amber-200';
};

const formatReviewDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function InfoRow({ icon: Icon, iconClass, label, children }) {
  return (
    <div className="flex gap-3">
      <div
        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}
      >
        <Icon className="w-4 h-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{children}</p>
      </div>
    </div>
  );
}

function DocPreviewSlot({ label, src, onZoom }) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-white">
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        {src ? (
          <button
            type="button"
            onClick={() => onZoom(src)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <Search className="w-3 h-3" aria-hidden />
            Zoom
          </button>
        ) : null}
      </div>
      <div className="p-2 flex-1 flex items-center justify-center bg-white min-h-[180px] max-h-[260px] overflow-hidden">
        {src ? (
          <img
            src={src}
            alt={label}
            className="max-w-full max-h-[240px] w-auto h-auto object-contain rounded-lg"
          />
        ) : (
          <p className="text-xs text-gray-400">Not uploaded</p>
        )}
      </div>
    </div>
  );
}

export default function KycCustomerReview({ userId: userIdProp }) {
  const params = useParams();
  const userId = userIdProp || params?.userId || params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kyc, setKyc] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [zoomSrc, setZoomSrc] = useState('');
  const [checks, setChecks] = useState({
    nameMatches: false,
    photoClear: false,
    notExpired: false,
  });

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }
    if (!userId) {
      setError('Invalid user id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    apiGetCustomerKycReview(userId, token)
      .then((res) => {
        const k = res.data?.kyc || null;
        setKyc(k);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load KYC review.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const canApprove =
    checks.nameMatches && checks.photoClear && checks.notExpired;

  const isPending = kyc?.status === 'pending';

  const handleApprove = async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token || !kyc?.userId) return;
    if (!canApprove) {
      setError('Please tick all verification checklist boxes before approval.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiReviewCustomerKyc(
        String(kyc.userId),
        { status: 'approved', comment: '' },
        token,
      );
      setSuccessOpen(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to approve KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token || !kyc?.userId) return;
    const msg = comment?.trim();
    if (!msg) {
      setError('Please enter rejection reason.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiReviewCustomerKyc(
        String(kyc.userId),
        { status: 'rejected', comment: msg },
        token,
      );
      setSuccessOpen(false);
      setComment('');
      router.push('/kyc/customer');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reject KYC.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <button
          type="button"
          onClick={() => router.push('/kyc/customer')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to KYC Dashboard
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          KYC Detail & Verification
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review customer documents and complete verification process
        </p>
        {/* <p className="text-sm text-gray-600 mt-2">
          {kyc.customerName} • {kyc.customerEmail}
        </p> */}
      </div>

      {error ? (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p
              className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium capitalize mt-1 ${getTone(kyc.status)}`}
            >
              {kyc.status}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/kyc/customer')}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to Queue
          </button>
        </div> */}

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Top row: 50% Customer Information | 50% Document Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 min-h-0">
              <p className="text-sm font-semibold text-gray-900">
                Customer Information
              </p>
              <div className="mt-4 space-y-4">
                <InfoRow
                  icon={User}
                  iconClass="bg-sky-50 text-sky-600"
                  label="Full Name"
                >
                  {kyc.customerName || '—'}
                </InfoRow>
                <InfoRow
                  icon={Calendar}
                  iconClass="bg-violet-50 text-violet-600"
                  label="Date of Birth"
                >
                  {kyc.dateOfBirth
                    ? new Date(kyc.dateOfBirth).toLocaleDateString('en-GB')
                    : '—'}
                </InfoRow>
                <InfoRow
                  icon={MapPin}
                  iconClass="bg-emerald-50 text-emerald-600"
                  label="Permanent Address"
                >
                  {kyc.permanentAddress || '—'}
                </InfoRow>
                <InfoRow
                  icon={CreditCard}
                  iconClass="bg-orange-50 text-orange-600"
                  label="ID Type"
                >
                  {kyc.idType || '—'}
                </InfoRow>
                <InfoRow
                  icon={Phone}
                  iconClass="bg-blue-50 text-blue-600"
                  label="Contact Number"
                >
                  {kyc.contactNumber || '—'}
                </InfoRow>
                <InfoRow
                  icon={Hash}
                  iconClass="bg-pink-50 text-pink-600"
                  label="Customer ID"
                >
                  {kyc.customerId || '—'}
                </InfoRow>
              </div>

              {!isPending ? (
                <div className="mt-5 rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">
                    Read-only review
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {kyc.status === 'approved'
                      ? `This customer is verified. Reviewed ${formatReviewDate(kyc.reviewedAt)}.`
                      : `This submission is ${kyc.status}. You can still view documents above.`}
                  </p>
                </div>
              ) : null}

              {kyc.rejectionReason ? (
                <div className="mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <p className="font-semibold">Previous rejection:</p>
                  <p className="mt-1">{kyc.rejectionReason}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  Document Preview
                </p>
              </div>
              <div className="p-4 space-y-3 flex-1 min-h-0 overflow-hidden">
                <DocPreviewSlot
                  label="Front Side"
                  src={kyc.aadhaarFront}
                  onZoom={setZoomSrc}
                />
                <DocPreviewSlot
                  label="Back Side"
                  src={kyc.aadhaarBack}
                  onZoom={setZoomSrc}
                />
              </div>
            </div>
          </div>

          {isPending ? (
            <>
              {/* Full-width Verification Checklist */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5">
                <p className="text-sm font-semibold text-gray-900">
                  Verification Checklist
                </p>
                <div className="mt-3 space-y-3">
                  <label className="flex gap-3 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={checks.nameMatches}
                      onChange={(e) =>
                        setChecks((prev) => ({
                          ...prev,
                          nameMatches: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Name Matches ID
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Verify that the name on document matches customer
                        profile.
                      </span>
                    </span>
                  </label>
                  <label className="flex gap-3 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={checks.photoClear}
                      onChange={(e) =>
                        setChecks((prev) => ({
                          ...prev,
                          photoClear: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Photo is Clear
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Ensure document photo is clearly visible and readable.
                      </span>
                    </span>
                  </label>
                  <label className="flex gap-3 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={checks.notExpired}
                      onChange={(e) =>
                        setChecks((prev) => ({
                          ...prev,
                          notExpired: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Document is Not Expired
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Check that the document is currently valid.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Full-width Decision */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <p className="text-sm font-semibold text-gray-900">Decision</p>
                {!canApprove ? (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700">
                      Reason for Rejection
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="e.g., Blurry photo, Document expired, Name mismatch..."
                      rows={4}
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                    />
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                    {canApprove ? (
                      <>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleReject}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-2 border-rose-500 bg-white text-rose-600 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5 shrink-0" aria-hidden />
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleApprove}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5 shrink-0"
                            aria-hidden
                          />
                          Approve & Verify
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleReject}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-2 border-rose-500 bg-white text-rose-600 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5 shrink-0" aria-hidden />
                          Submit Rejection
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleReject}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5 shrink-0" aria-hidden />
                          Confirm Rejection
                        </button>
                      </>
                    )}
                  </div>

                  <div className="lg:max-w-xs rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2.5 flex gap-2.5 shrink-0">
                    <CheckCircle2
                      className="w-4 h-4 text-sky-600 shrink-0 mt-0.5"
                      aria-hidden
                    />
                    <div>
                      <p className="text-xs font-semibold text-sky-900">
                        Physically Verified Badge
                      </p>
                      <p className="text-[11px] text-sky-800/80 mt-0.5 leading-snug">
                        Will be applied to customer profile upon approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {zoomSrc ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Document zoom"
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900">Preview</p>
              <button
                type="button"
                onClick={() => setZoomSrc('')}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close zoom"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-56px)] flex items-center justify-center bg-gray-900/5">
              <img
                src={zoomSrc}
                alt="Document full size"
                className="max-w-full max-h-[min(80vh,800px)] w-auto h-auto object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Customer Verified
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Verification completed successfully
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSuccessOpen(false);
                  router.push('/kyc/customer');
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm hover:bg-orange-600"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
