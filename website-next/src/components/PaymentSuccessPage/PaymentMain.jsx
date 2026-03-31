'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  Upload,
  ShieldCheck,
  CheckCircle2,
  FileText,
  X,
  CheckCircle,
} from 'lucide-react';
import { apiGetMyUserKyc, apiSubmitMyUserKyc } from '@/lib/api';

const PaymentMain = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState('');
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycState, setKycState] = useState({
    status: 'not_submitted',
    aadhaarFront: '',
    aadhaarBack: '',
    panCard: '',
  });
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycError, setKycError] = useState('');

  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [panCardFile, setPanCardFile] = useState(null);

  const aadhaarFrontRef = useRef(null);
  const aadhaarBackRef = useRef(null);
  const panCardRef = useRef(null);

  const prettyOrderId = useMemo(() => {
    const id = String(orderId || '').trim();
    if (!id) return '#ORD-NEW';
    return `#ORD-${id.slice(-6).toUpperCase()}`;
  }, [orderId]);

  const openKyc = () => setShowKycModal(true);
  const closeKyc = () => setShowKycModal(false);

  useEffect(() => {
    const fromQuery = searchParams?.get('orderId') || '';
    const fromStorage =
      typeof window !== 'undefined'
        ? localStorage.getItem('rentpay_last_order_id') || ''
        : '';
    setOrderId(fromQuery || fromStorage || '');
  }, [searchParams]);

  useEffect(() => {
    setLoadingKyc(true);
    apiGetMyUserKyc()
      .then((res) => {
        const kyc = res.data?.kyc || {};
        setKycState({
          status: String(kyc.status || 'not_submitted'),
          aadhaarFront: kyc.aadhaarFront || '',
          aadhaarBack: kyc.aadhaarBack || '',
          panCard: kyc.panCard || '',
        });
      })
      .catch(() => {
        setKycState({
          status: 'not_submitted',
          aadhaarFront: '',
          aadhaarBack: '',
          panCard: '',
        });
      })
      .finally(() => setLoadingKyc(false));
  }, []);

  const readyToSubmit =
    Boolean(aadhaarFrontFile || kycState.aadhaarFront) &&
    Boolean(aadhaarBackFile || kycState.aadhaarBack) &&
    Boolean(panCardFile || kycState.panCard);

  const dispatchEnabled = ['pending', 'approved'].includes(
    String(kycState.status || '').toLowerCase(),
  );

  const submitKyc = async () => {
    setKycError('');
    if (!readyToSubmit) {
      setKycError('Please upload Aadhaar Front, Aadhaar Back and PAN Card.');
      return;
    }

    const formData = new FormData();
    if (aadhaarFrontFile) formData.append('aadhaarFront', aadhaarFrontFile);
    if (aadhaarBackFile) formData.append('aadhaarBack', aadhaarBackFile);
    if (panCardFile) formData.append('panCard', panCardFile);

    setSubmittingKyc(true);
    try {
      const res = await apiSubmitMyUserKyc(formData);
      const kyc = res.data?.kyc || {};
      setKycState({
        status: String(kyc.status || 'pending'),
        aadhaarFront: kyc.aadhaarFront || '',
        aadhaarBack: kyc.aadhaarBack || '',
        panCard: kyc.panCard || '',
      });
      setAadhaarFrontFile(null);
      setAadhaarBackFile(null);
      setPanCardFile(null);
    } catch (err) {
      setKycError(err.response?.data?.message || 'Could not submit KYC.');
    } finally {
      setSubmittingKyc(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          <div className="flex justify-center mb-6">
            <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              Order Placed !
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Order <span className="font-medium">{prettyOrderId}</span> confirmed
            </p>

            <div className="mt-4 h-px bg-gray-200 max-w-sm mx-auto" />

            <p className="mt-3 text-xs sm:text-sm text-gray-700">
              🎉 Thank you for choosing Rentnpay!
            </p>
          </div>

          <div className="mt-8 sm:mt-10 bg-white border border-orange-200 rounded-3xl px-5 sm:px-8 py-6 sm:py-8 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center mb-2">
              One Last Thing !
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 text-center max-w-xl mx-auto">
              To ensure safety and dispatch your item, we need a quick KYC
              verification. Takes only 2 minutes.
            </p>

            <div className="mt-6 flex justify-center">
              <button
                onClick={openKyc}
                className="inline-flex items-center gap-3 px-8 sm:px-10 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-medium shadow-[0_10px_22px_rgba(249,115,22,0.45)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start KYC Now
                </span>
                <span className="text-xs sm:text-sm bg-white/10 px-3 py-1 rounded-full border border-white/30">
                  2 min
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => router.push('/orders')}
              className="w-full max-w-xs sm:max-w-sm border border-gray-300 rounded-full py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-800 bg-white hover:bg-gray-50"
            >
              Go to My Orders
            </button>
          </div>

          <div className="mt-4 text-center text-[11px] sm:text-xs text-gray-400">
            Need help? Contact{' '}
            <a
              href="mailto:support@rentnpay.com"
              className="text-orange-500 hover:underline"
            >
              support@rentnpay.com
            </a>
          </div>
        </div>
      </div>

      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-r from-green-50 to-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Identity Verification Required
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      To rent items, we need to verify your ID. This takes 2
                      minutes.
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeKyc}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs">
                    1
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    Upload Aadhaar & PAN
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      key: 'aadhaarFront',
                      label: 'Aadhaar Front',
                      file: aadhaarFrontFile,
                      existing: kycState.aadhaarFront,
                      inputRef: aadhaarFrontRef,
                      onChange: (file) => setAadhaarFrontFile(file),
                    },
                    {
                      key: 'aadhaarBack',
                      label: 'Aadhaar Back',
                      file: aadhaarBackFile,
                      existing: kycState.aadhaarBack,
                      inputRef: aadhaarBackRef,
                      onChange: (file) => setAadhaarBackFile(file),
                    },
                    {
                      key: 'panCard',
                      label: 'PAN Card',
                      file: panCardFile,
                      existing: kycState.panCard,
                      inputRef: panCardRef,
                      onChange: (file) => setPanCardFile(file),
                    },
                  ].map((doc) => {
                    const fileName = doc.file?.name || '';
                    const alreadyUploaded = Boolean(doc.existing);
                    return (
                      <button
                        type="button"
                        key={doc.key}
                        onClick={() => doc.inputRef.current?.click()}
                        className="border rounded-xl p-4 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          ref={doc.inputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => doc.onChange(e.target.files?.[0] || null)}
                        />
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg border flex items-center justify-center">
                          {fileName || alreadyUploaded ? (
                            <FileText className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Upload className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-700">{doc.label}</p>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                          {fileName
                            ? fileName
                            : alreadyUploaded
                              ? 'Uploaded'
                              : 'Click to upload'}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg p-3">
                  Tips: Ensure documents are clear, unblurred, and all corners
                  are visible. Accepted formats: JPG, PNG, PDF (Max 5MB).
                </div>
              </div>

              {kycError ? (
                <p className="text-sm text-red-600 -mt-2">{kycError}</p>
              ) : null}

              <button
                type="button"
                onClick={submitKyc}
                disabled={submittingKyc || loadingKyc || dispatchEnabled}
                className={`w-full py-3 rounded-xl text-sm font-medium ${
                  dispatchEnabled
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60'
                }`}
              >
                {dispatchEnabled
                  ? 'Dispatch & Delivery'
                  : submittingKyc
                    ? 'Submitting KYC...'
                    : 'Submit KYC & Enable Dispatch'}
              </button>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Your data is encrypted and safe. Verification status will be
                updated in &quot;My Orders&quot;.
              </div>

              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <p className="text-xs text-gray-600">
                  Current KYC status:{' '}
                  <span className="font-semibold capitalize">{kycState.status}</span>
                </p>
                {dispatchEnabled ? (
                  <p className="text-xs text-emerald-600 mt-1 inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Your documents are submitted. We will process dispatch.
                  </p>
                ) : null}
              </div>

              <div className="text-center">
                <button
                  onClick={closeKyc}
                  className="text-xs text-gray-500 hover:underline"
                >
                  I&apos;ll do this later
                </button>
                <p className="text-[10px] text-gray-400 mt-1">
                  (Delivery will be blocked until verification is complete)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentMain;
