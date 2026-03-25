'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGetVendorKycReview, apiReviewVendorKyc } from '@/service/api';

const riskYesNo = (value) => (value ? 'Yes' : 'No');

const docThumbClass = (active) =>
  `rounded-xl border p-1 transition ${
    active
      ? 'border-orange-300 bg-orange-50'
      : 'border-gray-200 bg-white hover:bg-gray-50'
  }`;

export default function KycReview({ vendorId: vendorIdProp }) {
  const params = useParams();
  const vendorId = vendorIdProp || params?.vendorId || params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kyc, setKyc] = useState(null);
  const [activeDoc, setActiveDoc] = useState('aadhaarFront');
  const [comment, setComment] = useState('');
  const [nameMatch, setNameMatch] = useState(null); // null | true | false
  const [addressMatch, setAddressMatch] = useState(null); // null | true | false
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

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
    apiGetVendorKycReview(vendorId, token)
      .then((res) => {
        setKyc(res.data?.kyc || null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load KYC review.');
      })
      .finally(() => setLoading(false));
  }, [vendorId]);

  useEffect(() => {
    if (!kyc) return;
    // If selected doc not present, fall back to first available.
    const docsOrder = ['aadhaarFront', 'aadhaarBack', 'panPhoto', 'ownerPhoto'];
    const found =
      docsOrder.find((k) => k === activeDoc && Boolean(kyc[k])) ||
      docsOrder.find((k) => Boolean(kyc[k]));
    setActiveDoc(found || 'aadhaarFront');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kyc]);

  const docs = useMemo(() => {
    if (!kyc) return [];
    return [
      { key: 'aadhaarFront', title: 'Aadhaar Card (Front)', src: kyc.aadhaarFront },
      { key: 'aadhaarBack', title: 'Aadhaar Card (Back)', src: kyc.aadhaarBack },
      { key: 'panPhoto', title: 'PAN Card', src: kyc.panPhoto },
      { key: 'ownerPhoto', title: 'Owner Photo', src: kyc.ownerPhoto },
    ].filter((d) => Boolean(d.src));
  }, [kyc]);

  const activeSrc = kyc ? kyc[activeDoc] : '';

  const addressVerified = Boolean(kyc?.permanentAddress && kyc.permanentAddress.length > 5);
  const identityVerified =
    Boolean(kyc?.fullName) && Boolean(kyc?.panNumber) && Boolean(kyc?.panPhoto) && Boolean(kyc?.aadhaarFront);

  const canApprove = nameMatch === true && addressMatch === true;

  const applySuggestedRejectReason = (reason) => {
    setError('');
    setComment((prev) => (prev?.trim() ? prev : reason));
  };

  const handleReview = async (nextStatus) => {
    if (!kyc?.vendorId) return;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;

    const payload = {
      status: nextStatus,
      comment: comment?.trim() || '',
    };

    if (nextStatus === 'approved' && !canApprove) {
      setError('Select Yes/No for both checks before approving.');
      return;
    }

    if (nextStatus === 'rejected' && !payload.comment) {
      setError('Please enter rejection reason in the comment box.');
      return;
    }

    if (nextStatus === 'approved' && submitting) return;

    setSubmitting(true);
    setError('');
    try {
      await apiReviewVendorKyc(String(kyc.vendorId), payload, token);
      if (nextStatus === 'approved') {
        setSuccessOpen(true);
      } else {
        router.push('/kyc');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update KYC.');
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

  if (error) {
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

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                {activeSrc ? (
                  <img
                    src={activeSrc}
                    alt={activeDoc}
                    className="w-full max-h-[380px] object-contain rounded-xl bg-white"
                  />
                ) : (
                  <div className="h-[380px] flex items-center justify-center text-gray-500">
                    No document available
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {docs.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setActiveDoc(d.key)}
                      className={docThumbClass(activeDoc === d.key)}
                      title={d.title}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={d.src}
                          alt={d.title}
                          className="w-14 h-10 object-cover rounded-lg bg-gray-100"
                        />
                        <span className="text-[11px] text-gray-700 whitespace-nowrap">
                          {d.key === 'aadhaarFront'
                            ? 'Front'
                            : d.key === 'aadhaarBack'
                              ? 'Back'
                              : d.key === 'panPhoto'
                                ? 'PAN'
                                : 'Owner'}
                        </span>
                      </div>
                    </button>
                  ))}
                  {!docs.length ? (
                    <span className="text-sm text-gray-500">No documents uploaded.</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                <h2 className="text-sm font-semibold text-gray-900">Verify Data Points</h2>
                <p className="text-xs text-gray-500 mt-1">Compare entered data with uploaded documents</p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-gray-200 p-3">
                    <p className="text-[11px] text-gray-500">Identity Match</p>
                    <p className="text-xs text-gray-700 font-semibold mt-1">
                      {kyc.fullName}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-3">
                      Does name match documents?
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setNameMatch(true)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs border ${
                          nameMatch === true
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNameMatch(false);
                          applySuggestedRejectReason('Name is mismatch');
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs border ${
                          nameMatch === false
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        No
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">
                      System check: {riskYesNo(identityVerified)} (documents present)
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3">
                    <p className="text-[11px] text-gray-500">Address Verification</p>
                    <p className="text-xs text-gray-700 font-semibold mt-1 line-clamp-2">
                      {kyc.permanentAddress}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-3">
                      Does address match document?
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setAddressMatch(true)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs border ${
                          addressMatch === true
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddressMatch(false);
                          applySuggestedRejectReason('Address is mismatch');
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs border ${
                          addressMatch === false
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        No
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">
                      System check: {riskYesNo(addressVerified)} (address provided)
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] text-gray-500 mb-2">Comment / Reason (for approval or rejection)</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe any issues, reasons, or notes before taking action..."
                    className="w-full min-h-[92px] px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handleReview('pending')}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Request Re-Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview('rejected')}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm hover:bg-rose-600 disabled:opacity-60"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview('approved')}
                    disabled={submitting || !canApprove}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm hover:bg-orange-600 disabled:opacity-60"
                  >
                    Approve Vendor
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Status: <span className="font-semibold capitalize">{kyc.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {successOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Vendor Activated!</h3>
                <p className="text-sm text-gray-500 mt-0.5">KYC approval completed successfully</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2 items-start">
                <span className="text-emerald-600">•</span>
                <span>Vendor can now create/list products.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-emerald-600">•</span>
                <span>Vendor profile is now visible to customers.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-emerald-600">•</span>
                <span>Activation details are saved in the admin system.</span>
              </li>
            </ul>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSuccessOpen(false);
                  router.push('/kyc');
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

