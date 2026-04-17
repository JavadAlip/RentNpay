'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle2, Clock3, FileText, ShieldCheck } from 'lucide-react';
import { apiGetMyUserKyc } from '@/lib/api';

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
  const [kycLoading, setKycLoading] = useState(true);
  const [kycState, setKycState] = useState({
    status: 'not_submitted',
    aadhaarFront: '',
    aadhaarBack: '',
    panCard: '',
    dateOfBirth: '',
    permanentAddress: '',
    contactNumber: '',
  });

  useEffect(() => {
    setKycLoading(true);
    apiGetMyUserKyc()
      .then((res) => {
        const kyc = res.data?.kyc || {};
        setKycState({
          status: String(kyc.status || 'not_submitted'),
          aadhaarFront: kyc.aadhaarFront || '',
          aadhaarBack: kyc.aadhaarBack || '',
          panCard: kyc.panCard || '',
          dateOfBirth: kyc.dateOfBirth || '',
          permanentAddress: kyc.permanentAddress || '',
          contactNumber: kyc.contactNumber || '',
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
        });
      })
      .finally(() => setKycLoading(false));
  }, []);

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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        My Profile & KYC
      </h1>
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
            {kycLoading ? (
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
            )}
          </div>

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
    </div>
  );
};

export default Profile;
