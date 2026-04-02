'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGetCustomerKycReview, apiReviewCustomerKyc } from '@/service/api';

const getTone = (status) => {
  if (status === 'approved')
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'rejected') return 'text-rose-700 bg-rose-50 border-rose-200';
  return 'text-amber-700 bg-amber-50 border-amber-200';
};

export default function KycCustomerReview({ userId: userIdProp }) {
  const params = useParams();
  const userId = userIdProp || params?.userId || params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kyc, setKyc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeKey, setActiveKey] = useState('aadhaarFront');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
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
        setDocuments(Array.isArray(k?.documents) ? k.documents : []);
        setActiveKey(k?.documents?.[0]?.key || 'aadhaarFront');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load KYC review.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const activeDoc = useMemo(
    () => documents.find((d) => d.key === activeKey) || null,
    [documents, activeKey],
  );

  const activeSrc = activeDoc?.src || '';
  const canApprove =
    checks.nameMatches && checks.photoClear && checks.notExpired;

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
      // re-fetch is optional; keep simple
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
        <h1 className="text-2xl font-semibold text-gray-900">
          Customer KYC Review
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {kyc.customerName} • {kyc.customerEmail}
        </p>
      </div>

      {error ? (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p
              className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-medium capitalize ${getTone(kyc.status)}`}
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
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4 sm:p-6">
          <div className="xl:col-span-1 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-900">
              Customer Information
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-gray-700">
                <span className="text-gray-500">Full Name:</span>{' '}
                <span className="font-medium">{kyc.customerName || '—'}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Date of Birth:</span>{' '}
                <span className="font-medium">
                  {kyc.dateOfBirth
                    ? new Date(kyc.dateOfBirth).toLocaleDateString('en-GB')
                    : '—'}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Permanent Address:</span>{' '}
                <span className="font-medium">
                  {kyc.permanentAddress || '—'}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">ID Type:</span>{' '}
                <span className="font-medium">{kyc.idType || '—'}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">ID Number:</span>{' '}
                <span className="font-medium">{kyc.idNumber || '—'}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Contact Number:</span>{' '}
                <span className="font-medium">{kyc.contactNumber || '—'}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Customer ID:</span>{' '}
                <span className="font-medium">{kyc.customerId || '—'}</span>
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-900">
                Verification Checklist
              </p>
              <div className="mt-2 space-y-2 text-xs text-gray-700">
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={checks.nameMatches}
                    onChange={(e) =>
                      setChecks((prev) => ({
                        ...prev,
                        nameMatches: e.target.checked,
                      }))
                    }
                    className="accent-emerald-600"
                  />
                  <span>Name matches ID (manual check)</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={checks.photoClear}
                    onChange={(e) =>
                      setChecks((prev) => ({
                        ...prev,
                        photoClear: e.target.checked,
                      }))
                    }
                    className="accent-emerald-600"
                  />
                  <span>Aadhaar/PAN photo is clear and readable</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={checks.notExpired}
                    onChange={(e) =>
                      setChecks((prev) => ({
                        ...prev,
                        notExpired: e.target.checked,
                      }))
                    }
                    className="accent-emerald-600"
                  />
                  <span>Document is not expired (manual)</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleReject}
                className="w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm hover:bg-rose-600 disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={submitting || !canApprove}
                onClick={handleApprove}
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Approve & Verify
              </button>
            </div>

            {kyc.rejectionReason ? (
              <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                <p className="font-semibold">Previous rejection:</p>
                <p className="mt-1">{kyc.rejectionReason}</p>
              </div>
            ) : null}
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-gray-200 overflow-hidden bg-slate-900 text-slate-100">
            <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Document Preview</p>
              </div>
            </div>

            <div className="border-t border-slate-700 bg-slate-900 px-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                  <p className="text-xs text-slate-400 mb-2">Front Side</p>
                  {kyc.aadhaarFront ? (
                    <img
                      src={kyc.aadhaarFront}
                      alt="Aadhaar front"
                      className="w-full max-h-[210px] object-contain rounded-lg bg-white"
                    />
                  ) : (
                    <p className="text-xs text-slate-500">Not uploaded</p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                  <p className="text-xs text-slate-400 mb-2">Back Side</p>
                  {kyc.aadhaarBack ? (
                    <img
                      src={kyc.aadhaarBack}
                      alt="Aadhaar back"
                      className="w-full max-h-[210px] object-contain rounded-lg bg-white"
                    />
                  ) : (
                    <p className="text-xs text-slate-500">Not uploaded</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
