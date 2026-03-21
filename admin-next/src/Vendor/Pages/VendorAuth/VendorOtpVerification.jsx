'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { vendorVerifyOtp, clearError } from '../../../redux/slices/vendorSlice';

const VendorOtpVerification = ({ onChangeEmail, onSuccess }) => {
  const dispatch = useDispatch();
  // email comes from Redux state (set during signup), no need to pass as prop
  const { loading, error, pendingEmail, otpVerified } = useSelector(
    (state) => state.vendor,
  );

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    dispatch(clearError());
  }, []);

  // Navigate away once OTP is verified
  useEffect(() => {
    if (otpVerified) {
      if (onSuccess) onSuccess();
    }
  }, [otpVerified]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = () => {
    if (!canResend) return;
    // You can dispatch vendorSignup again here if you store the form,
    // or call a dedicated resend-otp endpoint. For now, just reset UI.
    setOtp(['', '', '', '', '', '']);
    setCountdown(30);
    setCanResend(false);
    inputRefs.current[0]?.focus();
  };

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    inputRefs.current[nextEmpty]?.focus();
  };

  const handleVerify = () => {
    if (otp.join('').length < 6 || !pendingEmail) return;
    dispatch(
      vendorVerifyOtp({
        emailAddress: pendingEmail,
        otp: otp.join(''),
      }),
    );
  };

  const isFilled = otp.every((d) => d !== '');

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.10)] border border-gray-100 px-10 py-10 flex flex-col items-center">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-7">
        <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <rect
              x="3"
              y="3"
              width="8"
              height="8"
              rx="2"
              fill="white"
              opacity="0.9"
            />
            <rect
              x="13"
              y="3"
              width="8"
              height="8"
              rx="2"
              fill="white"
              opacity="0.6"
            />
            <rect
              x="3"
              y="13"
              width="8"
              height="8"
              rx="2"
              fill="white"
              opacity="0.6"
            />
            <rect
              x="13"
              y="13"
              width="8"
              height="8"
              rx="2"
              fill="white"
              opacity="0.3"
            />
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          Rentnpay
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Verify Your Email
      </h1>
      <p className="text-sm text-gray-400 text-center mb-1">
        Enter the 6-digit code sent to
      </p>
      <p className="text-sm font-semibold text-blue-600 text-center mb-5 break-all">
        {pendingEmail || '—'}
      </p>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-8">
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
      </div>

      {/* API error banner */}
      {error && (
        <div className="w-full mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {/* OTP inputs */}
      <div className="flex gap-3 mb-5" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-12 h-14 text-center text-lg font-semibold rounded-xl border-2 outline-none transition-all
              ${digit ? 'border-orange-400 bg-orange-50 text-gray-900' : 'border-gray-200 bg-white text-gray-900'}
              focus:border-blue-400 focus:ring-2 focus:ring-blue-50`}
          />
        ))}
      </div>

      {/* Resend */}
      <p className="text-sm text-gray-400 mb-7 text-center">
        {canResend ? (
          <button
            onClick={handleResend}
            className="text-orange-500 font-semibold hover:underline"
          >
            Resend OTP
          </button>
        ) : (
          <>
            Resend OTP in{' '}
            <span className="text-gray-800 font-semibold">{countdown}s</span>
          </>
        )}
      </p>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={!isFilled || loading}
        className={`w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]
          ${isFilled && !loading ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-200 cursor-not-allowed'}`}
      >
        {loading ? 'Verifying...' : 'Verify & Continue'}
      </button>

      <button
        onClick={() => (onChangeEmail ? onChangeEmail() : null)}
        className="mt-4 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        ← Change Email Address
      </button>
    </div>
  );
};

export default VendorOtpVerification;
