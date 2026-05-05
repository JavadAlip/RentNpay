'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  Upload,
  ShieldCheck,
  CheckCircle2,
  X,
  CheckCircle,
  Camera,
  Info,
  ShieldAlert,
  Package,
  PartyPopper,
  Shield,
} from 'lucide-react';
import { apiGetMyUserKyc, apiSubmitMyUserKyc } from '@/lib/api';
import customerKycIcon from '../../../../admin-next/src/assets/icons/customer-kyc.png';
import customerAdhaarIcon from '../../../../admin-next/src/assets/icons/customer-adhaar.png';
import customerPanIcon from '../../../../admin-next/src/assets/icons/customer-pan.png';
import placedIcon from '@/assets/icons/placed.png';

function staticImageSrc(mod) {
  return typeof mod === 'string' ? mod : (mod?.src ?? '');
}

function KycHeaderIcon({ className }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 ${className}`}
      >
        <ShieldCheck className="w-6 h-6 text-white" />
      </div>
    );
  }
  return (
    <img
      src={staticImageSrc(customerKycIcon)}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function DocTypeIcon({ src, className }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Upload className={`${className} text-gray-400`} aria-hidden />;
  }
  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

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
    dateOfBirth: '',
    permanentAddress: '',
    contactNumber: '',
  });
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycError, setKycError] = useState('');
  const [dispatchStage, setDispatchStage] = useState('idle'); // idle | waiting | redirecting

  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [panCardFile, setPanCardFile] = useState(null);

  const aadhaarFrontRef = useRef(null);
  const aadhaarBackRef = useRef(null);
  const panCardRef = useRef(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [selfiePhase, setSelfiePhase] = useState('idle'); // idle | live | preview
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState('');
  const [selfieError, setSelfieError] = useState('');

  const stopSelfieStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startSelfieCamera = useCallback(async () => {
    setSelfieError('');
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setSelfieError('Camera is not available in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      stopSelfieStream();
      streamRef.current = stream;
      setSelfiePhase('live');
      requestAnimationFrame(() => {
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      });
    } catch (e) {
      setSelfieError(
        e?.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow the camera to take a selfie.'
          : 'Could not start the camera.',
      );
      setSelfiePhase('idle');
    }
  }, [stopSelfieStream]);

  const captureSelfie = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopSelfieStream();
        setSelfiePreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setSelfiePhase('preview');
      },
      'image/jpeg',
      0.92,
    );
  }, [stopSelfieStream]);

  const retakeSelfie = useCallback(async () => {
    setSelfiePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    stopSelfieStream();
    await startSelfieCamera();
  }, [startSelfieCamera, stopSelfieStream]);

  useEffect(() => {
    if (!showKycModal) {
      stopSelfieStream();
      setSelfiePhase('idle');
      setSelfieError('');
      setSelfiePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
    }
  }, [showKycModal, stopSelfieStream]);

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
        let dob = '';
        if (kyc.dateOfBirth != null && kyc.dateOfBirth !== '') {
          const d = new Date(kyc.dateOfBirth);
          if (!Number.isNaN(d.getTime())) {
            dob = d.toISOString().slice(0, 10);
          }
        }
        setKycState({
          status: String(kyc.status || 'not_submitted'),
          aadhaarFront: kyc.aadhaarFront || '',
          aadhaarBack: kyc.aadhaarBack || '',
          panCard: kyc.panCard || '',
          dateOfBirth: dob,
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
      .finally(() => setLoadingKyc(false));
  }, []);

  const docsReady =
    Boolean(aadhaarFrontFile || kycState.aadhaarFront) &&
    Boolean(aadhaarBackFile || kycState.aadhaarBack) &&
    Boolean(panCardFile || kycState.panCard);

  const contactDigits = String(kycState.contactNumber || '').replace(/\D/g, '');
  const personalOk =
    Boolean(kycState.dateOfBirth?.trim()) &&
    kycState.permanentAddress.trim().length >= 5 &&
    contactDigits.length >= 10;

  const readyToSubmit = personalOk && docsReady;

  const dispatchEnabled = ['pending', 'approved'].includes(
    String(kycState.status || '').toLowerCase(),
  );

  const submitKyc = async () => {
    setKycError('');
    if (!personalOk) {
      setKycError(
        'Please enter date of birth, permanent address and a valid contact number (10+ digits).',
      );
      return;
    }
    if (!docsReady) {
      setKycError('Please upload Aadhaar Front, Aadhaar Back and PAN Card.');
      return;
    }

    const formData = new FormData();
    formData.append('dateOfBirth', kycState.dateOfBirth);
    formData.append('permanentAddress', kycState.permanentAddress.trim());
    formData.append('contactNumber', kycState.contactNumber.trim());
    if (aadhaarFrontFile) formData.append('aadhaarFront', aadhaarFrontFile);
    if (aadhaarBackFile) formData.append('aadhaarBack', aadhaarBackFile);
    if (panCardFile) formData.append('panCard', panCardFile);

    setSubmittingKyc(true);
    try {
      const res = await apiSubmitMyUserKyc(formData);
      const kyc = res.data?.kyc || {};
      let dob = '';
      if (kyc.dateOfBirth != null && kyc.dateOfBirth !== '') {
        const d = new Date(kyc.dateOfBirth);
        if (!Number.isNaN(d.getTime())) {
          dob = d.toISOString().slice(0, 10);
        }
      }
      setKycState({
        status: String(kyc.status || 'pending'),
        aadhaarFront: kyc.aadhaarFront || '',
        aadhaarBack: kyc.aadhaarBack || '',
        panCard: kyc.panCard || '',
        dateOfBirth: dob || kycState.dateOfBirth,
        permanentAddress: kyc.permanentAddress || kycState.permanentAddress,
        contactNumber: kyc.contactNumber || kycState.contactNumber,
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

  const handleDispatch = () => {
    if (dispatchStage !== 'idle') return;
    setDispatchStage('waiting');
    setTimeout(() => {
      setDispatchStage('redirecting');
      router.push('/orders');
    }, 3000);
  };

  return (
    <>
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          {/* <div className="flex justify-center mb-6">
            <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-orange-500" />
            </div>
          </div> */}

          <div className="flex justify-center mb-6">
            <div className="h-14 w-14 rounded-full bg-[#FFF7ED] flex items-center justify-center">
              <img
                src={placedIcon.src}
                alt="Placed"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-black">
              Order Placed !
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Order <span className="font-medium">{prettyOrderId}</span>{' '}
              confirmed
            </p>

            <div className="mt-4 h-px bg-gray-200 max-w-sm mx-auto" />

            {/* <p className="mt-3 text-xs sm:text-sm text-gray-700">
              Thank you for choosing Rentnpay!
            </p> */}
            <p className="mt-3 text-xs sm:text-sm text-[#64748B] flex items-center justify-center gap-2">
              <PartyPopper size={16} color="#F97316" />
              Thank you for choosing Rentnpay!
            </p>
          </div>
          <div className="mt-8 sm:mt-10 bg-white border-2 border-orange-200 rounded-3xl px-5 sm:px-8 py-6 sm:py-8 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-black text-center mb-2">
              One Last Thing !
            </h2>
            <p className="text-xs sm:text-sm text-black text-center max-w-xl mx-auto">
              To ensure safety and dispatch your item, we need a{' '}
              <span className="text-[#F97316] font-medium">
                quick KYC verification.
              </span>
              Takes only 2 minutes.
            </p>

            {/* <div className="mt-6 flex justify-center">
              <button
                onClick={openKyc}
                className="inline-flex items-center gap-3 px-8 sm:px-10 py-3 rounded-2xl bg-[#F97316] hover:bg-orange-600 text-white text-sm sm:text-base font-medium shadow-[0_10px_22px_rgba(249,115,22,0.45)]"
              >
                <span className="inline-flex items-center text-sm font-semibold gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Start KYC Now
                </span>
                <span className="text-xs sm:text-sm bg-white/10 px-3 py-1 rounded-full border border-white/30">
                  2 min
                </span>
              </button>
            </div> */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={openKyc}
                className="w-1/2 inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3 rounded-2xl bg-[#F97316] hover:bg-orange-600 text-white text-sm sm:text-base font-medium shadow-[0_10px_22px_rgba(249,115,22,0.45)]"
              >
                <span className="inline-flex items-center text-sm font-semibold gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Start KYC Now
                </span>
                <span className="text-xs sm:text-sm bg-white/10 px-3 py-1 rounded-full border border-white/30">
                  2 min
                </span>
              </button>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            {/* <button
              onClick={() => router.push('/orders')}
              className="w-full max-w-xs sm:max-w-sm border border-gray-300 rounded-full py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-800 bg-white hover:bg-gray-50"
            >
              Go to My Orders
            </button> */}
            <button
              onClick={() => router.push('/orders')}
              className="w-full max-w-xs sm:max-w-sm border border-[#D1D5DC] rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-black bg-white hover:bg-gray-50 inline-flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              Go to My Orders
            </button>
          </div>
          <div className="mt-4 text-center font-semibold  text-sm sm:text-xs text-[#64748B]">
            Need help? Contact{' '}
            <a
              href="mailto:support@rentnpay.com"
              className="text-[#3B82F6] hover:underline"
            >
              support@rentnpay.com
            </a>
          </div>
        </div>
      </div>

      {showKycModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-[#F0FDF4] to-[#EFF6FF] rounded-t-2xl">
              <div className="flex items-start justify-between gap-3">
                {/* <div className="flex gap-3 min-w-0">
                  <KycHeaderIcon className="h-11 w-11 object-contain shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-black leading-snug">
                      Identity Verification Required
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      To rent items, we need to verify your ID. This takes{' '}
                      <span className="font-semibold text-gray-700">
                        2 minutes
                      </span>
                      .
                    </p>
                  </div>
                </div> */}
                <div className="flex gap-3 min-w-0">
                  <div className="flex items-center">
                    <KycHeaderIcon className="h-16 w-16  object-contain shrink-0" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-black leading-snug">
                      Identity Verification Required
                    </h2>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      To rent items, we need to verify your ID. This takes{' '}
                      <span className="font-semibold text-gray-700">
                        2 minutes
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeKyc}
                  className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="p-5 space-y-6 max-h-[80vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#F37021] text-white text-xs font-semibold shrink-0">
                    1
                  </span>
                  <p className="text-sm font-semibold text-gray-800">
                    Your details
                  </p>
                </div>

                <label className="block text-xs font-medium text-gray-700">
                  Date of birth
                  <input
                    type="date"
                    value={kycState.dateOfBirth}
                    onChange={(e) =>
                      setKycState((s) => ({
                        ...s,
                        dateOfBirth: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-700">
                  Permanent address
                  <textarea
                    value={kycState.permanentAddress}
                    onChange={(e) =>
                      setKycState((s) => ({
                        ...s,
                        permanentAddress: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="House no., street, city, state, PIN"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black resize-y min-h-[72px]"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-700">
                  Contact number
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={kycState.contactNumber}
                    onChange={(e) =>
                      setKycState((s) => ({
                        ...s,
                        contactNumber: e.target.value,
                      }))
                    }
                    placeholder="10-digit mobile number"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#F37021] text-white text-xs font-semibold shrink-0">
                    2
                  </span>
                  <p className="text-sm font-semibold text-black">
                    Upload Aadhaar & PAN
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      key: 'aadhaarFront',
                      label: 'Aadhaar Front',
                      iconSrc: staticImageSrc(customerAdhaarIcon),
                      file: aadhaarFrontFile,
                      existing: kycState.aadhaarFront,
                      inputRef: aadhaarFrontRef,
                      onChange: (file) => setAadhaarFrontFile(file),
                    },

                    {
                      key: 'aadhaarBack',
                      label: 'Aadhaar Back',
                      iconSrc: staticImageSrc(customerAdhaarIcon),
                      file: aadhaarBackFile,
                      existing: kycState.aadhaarBack,
                      inputRef: aadhaarBackRef,
                      onChange: (file) => setAadhaarBackFile(file),
                    },
                    {
                      key: 'panCard',
                      label: 'PAN Card',
                      iconSrc: staticImageSrc(customerPanIcon),
                      file: panCardFile,
                      existing: kycState.panCard,
                      inputRef: panCardRef,
                      onChange: (file) => setPanCardFile(file),
                    },
                  ].map((doc) => {
                    const fileName = doc.file?.name || '';
                    const alreadyUploaded = Boolean(doc.existing);
                    const hasDoc = Boolean(fileName || alreadyUploaded);
                    const actionLabel = hasDoc
                      ? `Re-upload ${doc.label}`
                      : 'Click to upload';
                    return (
                      <button
                        type="button"
                        key={doc.key}
                        onClick={() => doc.inputRef.current?.click()}
                        className="border border-[#CBD5E1] rounded-xl p-4 text-center bg-[#F8FAFC] cursor-pointer transition-colors"
                      >
                        <input
                          ref={doc.inputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) =>
                            doc.onChange(e.target.files?.[0] || null)
                          }
                        />
                        <div className="flex flex-col items-center gap-1.5">
                          <DocTypeIcon
                            src={doc.iconSrc}
                            className="h-12 w-12 object-contain"
                          />
                        </div>
                        <p className="text-xs font-semibold text-gray-800 mt-2">
                          {doc.label}
                        </p>
                        <p
                          className="text-[10px] text-gray-400 mt-1 line-clamp-2"
                          title={hasDoc ? actionLabel : undefined}
                        >
                          {actionLabel}
                        </p>
                        {hasDoc && (
                          <p className="text-[10px] text-green-600 mt-1 font-medium truncate max-w-full">
                            {doc.file?.name || doc.existing?.split('/').pop()}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2 bg-[#EFF6FF] border border-[#BEDBFF] text-[#1C398E] text-xs rounded-lg p-3">
                  <Info
                    className="w-4 h-4 text-[#1C398E] shrink-0 mt-0.5"
                    aria-hidden
                  />
                  <p>
                    <span className="font-semibold">Tips:</span> Ensure
                    documents are clear, unblurred, and all corners are visible.
                    Accepted formats: JPG, PNG, PDF (Max 5MB).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#F37021] text-white text-xs font-semibold shrink-0">
                    3
                  </span>
                  <p className="text-sm font-semibold text-black">
                    Live Photo Check
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-slate-50/60 min-h-[260px] flex flex-col overflow-hidden">
                  {selfiePhase === 'idle' ? (
                    <div className="flex flex-col items-center justify-center flex-1 px-4 py-10 gap-3">
                      <div className="w-24 h-24 rounded-full border border-[#CBD5E1] bg-white flex items-center justify-center">
                        <Camera className="w-9 h-9 text-gray-400" aria-hidden />
                      </div>
                      <p className="text-xs text-gray-500 text-center max-w-[220px]">
                        Please ensure your face is clearly visible
                      </p>
                      <button
                        type="button"
                        onClick={startSelfieCamera}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#F37021] bg-white text-[#F37021] text-xs font-medium hover:bg-orange-50 transition-colors"
                      >
                        <Camera className="w-4 h-4" aria-hidden />
                        Take Selfie
                      </button>
                    </div>
                  ) : null}

                  {selfiePhase === 'live' ? (
                    <div className="flex flex-col flex-1 p-3 gap-3 min-h-[260px]">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full flex-1 min-h-[200px] max-h-[280px] rounded-lg object-cover bg-black"
                      />
                      <button
                        type="button"
                        onClick={captureSelfie}
                        className="w-full py-2.5 rounded-lg bg-[#F37021] hover:bg-orange-600 text-white text-sm font-medium transition-colors"
                      >
                        Capture photo
                      </button>
                    </div>
                  ) : null}

                  {selfiePhase === 'preview' ? (
                    <div className="flex flex-col flex-1 p-3 gap-3 min-h-[260px]">
                      <img
                        src={selfiePreviewUrl}
                        alt="Selfie preview"
                        className="w-full flex-1 min-h-[200px] max-h-[280px] rounded-lg object-cover bg-black"
                      />
                      <button
                        type="button"
                        onClick={retakeSelfie}
                        className="text-sm font-medium text-[#F37021] hover:underline py-1"
                      >
                        Re-take selfie
                      </button>
                    </div>
                  ) : null}
                </div>

                {selfieError ? (
                  <p className="text-xs text-red-600">{selfieError}</p>
                ) : null}
              </div>

              {kycError ? (
                <p className="text-sm text-red-600 -mt-2">{kycError}</p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  if (dispatchEnabled) return handleDispatch();
                  return submitKyc();
                }}
                disabled={
                  submittingKyc ||
                  loadingKyc ||
                  dispatchStage !== 'idle' ||
                  (!dispatchEnabled && !readyToSubmit)
                }
                className={`w-full py-3 rounded-xl text-sm font-medium ${
                  dispatchStage === 'redirecting'
                    ? 'bg-emerald-100 text-emerald-700'
                    : dispatchStage === 'waiting'
                      ? 'bg-amber-100 text-amber-700'
                      : dispatchEnabled
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60'
                }`}
              >
                {dispatchEnabled
                  ? dispatchStage === 'waiting'
                    ? 'Dispatching...'
                    : dispatchStage === 'redirecting'
                      ? 'Redirecting...'
                      : 'Dispatch & Delivery'
                  : submittingKyc
                    ? 'Submitting KYC...'
                    : 'Submit KYC & Enable Dispatch'}
              </button>

              <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                <Shield
                  className="w-4 h-4 text-[#00A63E] shrink-0 mt-0.5"
                  aria-hidden
                />
                <p>
                  Your data is{' '}
                  <span className="font-semibold text-gray-700">
                    encrypted and safe
                  </span>
                  . Verification status will be updated in &quot;My
                  Orders&quot;.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <p className="text-xs text-gray-600">
                  Current KYC status:{' '}
                  <span className="font-semibold capitalize">
                    {kycState.status}
                  </span>
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
                  className="text-sm text-[#64748B] font-semibold hover:underline"
                >
                  I&apos;ll do this later
                </button>
                <p className="text-xs text-[#64748B] mt-1">
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
