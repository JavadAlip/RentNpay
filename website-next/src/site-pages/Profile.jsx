'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { apiGetMyUserKyc, apiSubmitMyUserKyc } from '@/lib/api';

const KYC_STATUS_MAP = {
  approved: {
    label: 'Approved',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  pending: {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  rejected: {
    label: 'Rejected',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  not_submitted: {
    label: 'Not Submitted',
    className: 'border-gray-200 bg-gray-50 text-gray-700',
  },
};

function formatDateOnly(value) {
  if (!value) return 'Not provided';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Not provided';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fileNameFromUrl(url) {
  if (!url) return '';
  try {
    const clean = String(url).split('?')[0];
    const parts = clean.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'Document');
  } catch {
    return 'Document';
  }
}

function isPdfDoc(url) {
  if (!url) return false;
  const clean = String(url).split('?')[0].toLowerCase();
  return clean.endsWith('.pdf');
}

const Profile = () => {
  const { user } = useSelector((s) => s.auth);
  const searchParams = useSearchParams();
  const [kycLoading, setKycLoading] = useState(true);
  const [kycState, setKycState] = useState({
    status: 'not_submitted',
    aadhaarFront: '',
    aadhaarBack: '',
    panCard: '',
    dateOfBirth: '',
    permanentAddress: '',
    contactNumber: '',
    rejectionReason: '',
  });
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycSubmitError, setKycSubmitError] = useState('');
  const [editForm, setEditForm] = useState({
    dateOfBirth: '',
    permanentAddress: '',
    contactNumber: '',
  });
  const [files, setFiles] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
  });

  useEffect(() => {
    setKycLoading(true);
    apiGetMyUserKyc()
      .then((res) => {
        const kyc = res.data?.kyc || {};
        const next = {
          status: String(kyc.status || 'not_submitted'),
          aadhaarFront: kyc.aadhaarFront || '',
          aadhaarBack: kyc.aadhaarBack || '',
          panCard: kyc.panCard || '',
          dateOfBirth: kyc.dateOfBirth || '',
          permanentAddress: kyc.permanentAddress || '',
          contactNumber: kyc.contactNumber || '',
          rejectionReason: kyc.rejectionReason || '',
        };
        setKycState(next);
        setEditForm({
          dateOfBirth: next.dateOfBirth
            ? String(next.dateOfBirth).slice(0, 10)
            : '',
          permanentAddress: next.permanentAddress || '',
          contactNumber: next.contactNumber || '',
        });
      })
      .catch(() => {
        setKycState({
          status: 'not_submitted',
          aadhaarFront: '',
          aadhaarBack: '',
          panCard: '',
          dateOfBirth: '',
          permanentAddress: '',
          contactNumber: '',
          rejectionReason: '',
        });
      })
      .finally(() => setKycLoading(false));
  }, []);

  useEffect(() => {
    const shouldOpen = searchParams?.get('kyc') === 'update';
    if (shouldOpen) setShowKycModal(true);
  }, [searchParams]);

  const clearKycQueryParam = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('kyc');
    window.history.replaceState({}, '', url.toString());
  };

  const openKycModal = () => {
    setKycSubmitError('');
    setFiles({ aadhaarFront: null, aadhaarBack: null, panCard: null });
    setEditForm({
      dateOfBirth: kycState.dateOfBirth
        ? String(kycState.dateOfBirth).slice(0, 10)
        : '',
      permanentAddress: kycState.permanentAddress || '',
      contactNumber: kycState.contactNumber || '',
    });
    setShowKycModal(true);
  };

  const closeKycModal = () => {
    setShowKycModal(false);
    clearKycQueryParam();
  };

  const submitKycUpdate = async (e) => {
    e.preventDefault();
    setKycSubmitError('');
    setKycSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('dateOfBirth', editForm.dateOfBirth);
      formData.append('permanentAddress', editForm.permanentAddress);
      formData.append('contactNumber', editForm.contactNumber);
      if (files.aadhaarFront)
        formData.append('aadhaarFront', files.aadhaarFront);
      if (files.aadhaarBack) formData.append('aadhaarBack', files.aadhaarBack);
      if (files.panCard) formData.append('panCard', files.panCard);

      const res = await apiSubmitMyUserKyc(formData);
      const kyc = res.data?.kyc || {};
      const next = {
        status: String(kyc.status || 'pending'),
        aadhaarFront: kyc.aadhaarFront || '',
        aadhaarBack: kyc.aadhaarBack || '',
        panCard: kyc.panCard || '',
        dateOfBirth: kyc.dateOfBirth || editForm.dateOfBirth || '',
        permanentAddress:
          kyc.permanentAddress || editForm.permanentAddress || '',
        contactNumber: kyc.contactNumber || editForm.contactNumber || '',
        rejectionReason: kyc.rejectionReason || '',
      };
      setKycState(next);
      closeKycModal();
    } catch (err) {
      setKycSubmitError(
        err?.response?.data?.message ||
          'Failed to update KYC. Please try again.',
      );
    } finally {
      setKycSubmitting(false);
    }
  };

  const normalizedStatus = String(
    kycState.status || 'not_submitted',
  ).toLowerCase();
  const statusMeta =
    KYC_STATUS_MAP[normalizedStatus] || KYC_STATUS_MAP.not_submitted;
  const docs = [
    { key: 'aadhaarFront', label: 'Aadhaar Front', url: kycState.aadhaarFront },
    { key: 'aadhaarBack', label: 'Aadhaar Back', url: kycState.aadhaarBack },
    { key: 'panCard', label: 'PAN Card', url: kycState.panCard },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">My Profile & KYC</h1>
        <button
          type="button"
          onClick={openKycModal}
          className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
        >
        
          Update KYC
        </button>
      </div> */}

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">My Profile & KYC</h1>
        {normalizedStatus === 'approved' ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${KYC_STATUS_MAP.approved.className}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {KYC_STATUS_MAP.approved.label}
          </span>
        ) : (
          <button
            type="button"
            onClick={openKycModal}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
          >
            Update KYC
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {/* <h2 className="text-base font-semibold text-gray-900 mb-4">Details</h2> */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Full Name
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {user?.name || user?.fullName || 'Not provided'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Email
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 break-all">
                {user?.email || user?.emailAddress || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              {/* <ShieldCheck className="w-5 h-5 text-orange-500" /> */}
              <h2 className="text-base font-semibold text-gray-900">
                KYC Details
              </h2>
            </div>
            {/* {kycLoading ? (
              <span className="text-xs text-gray-500">Loading...</span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
              >
                {normalizedStatus === 'approved' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock3 className="w-3.5 h-3.5" />
                )}
                {statusMeta.label}
              </span>
            )} */}
          </div>

          {normalizedStatus === 'rejected' ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">
                KYC rejected by admin
              </p>
              <p className="text-xs text-red-600 mt-1">
                {kycState.rejectionReason ||
                  'Please update your documents and resubmit KYC.'}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Date of Birth
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDateOnly(kycState.dateOfBirth)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Contact Number
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {kycState.contactNumber || 'Not provided'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Permanent Address
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap break-words">
                {kycState.permanentAddress || 'Not provided'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Uploaded Documents (Read only)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {docs.map((doc) => (
                <article
                  key={doc.key}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-gray-800">
                      {doc.label}
                    </p>
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                  {doc.url ? (
                    <>
                      <div className="h-40 rounded-lg border border-gray-200 bg-white overflow-hidden">
                        {isPdfDoc(doc.url) ? (
                          <iframe
                            src={doc.url}
                            title={`${doc.label} preview`}
                            className="w-full h-full"
                          />
                        ) : (
                          <img
                            src={doc.url}
                            alt={`${doc.label} document`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-gray-500 truncate">
                        {fileNameFromUrl(doc.url)}
                      </p>
                    </>
                  ) : (
                    <div className="h-40 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center">
                      <p className="text-xs text-gray-500">Not uploaded</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showKycModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Update KYC
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submit corrected documents for re-verification
                </p>
              </div>
              <button
                type="button"
                onClick={closeKycModal}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitKycUpdate} className="p-5 space-y-4">
              <label className="block text-xs font-medium text-gray-700">
                Date of birth
                <input
                  type="date"
                  required
                  value={editForm.dateOfBirth}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, dateOfBirth: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-xs font-medium text-gray-700">
                Permanent address
                <textarea
                  required
                  value={editForm.permanentAddress}
                  onChange={(e) =>
                    setEditForm((s) => ({
                      ...s,
                      permanentAddress: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-y"
                />
              </label>

              <label className="block text-xs font-medium text-gray-700">
                Contact number
                <input
                  type="tel"
                  required
                  value={editForm.contactNumber}
                  onChange={(e) =>
                    setEditForm((s) => ({
                      ...s,
                      contactNumber: e.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  ['aadhaarFront', 'Aadhaar Front', kycState.aadhaarFront],
                  ['aadhaarBack', 'Aadhaar Back', kycState.aadhaarBack],
                  ['panCard', 'PAN Card', kycState.panCard],
                ].map(([key, label, existing]) => (
                  <label
                    key={key}
                    className="rounded-xl border border-gray-200 p-3 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        setFiles((s) => ({
                          ...s,
                          [key]: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    <Upload className="w-4 h-4 mx-auto text-gray-400" />
                    <p className="text-xs font-semibold text-gray-800 mt-1">
                      {label}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                      {files[key]?.name ||
                        (existing ? 'Already uploaded' : 'Click to upload')}
                    </p>
                  </label>
                ))}
              </div>

              {kycSubmitError ? (
                <p className="text-xs text-red-600">{kycSubmitError}</p>
              ) : null}

              <button
                type="submit"
                disabled={kycSubmitting}
                className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
              >
                {kycSubmitting ? 'Submitting KYC...' : 'Submit KYC Update'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Profile;
