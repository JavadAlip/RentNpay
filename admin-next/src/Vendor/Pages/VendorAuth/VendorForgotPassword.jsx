'use client';

import React, { useMemo, useState } from 'react';
import {
  apiVendorForgotPassword,
  apiVendorResetPassword,
  apiVendorVerifyResetOtp,
} from '@/service/api';
import { toast } from 'react-toastify';

const VendorForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1 email, 2 otp, 3 reset
  const [emailAddress, setEmailAddress] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testOtp, setTestOtp] = useState('');

  const canSubmit = useMemo(() => {
    if (step === 1) return !!emailAddress;
    if (step === 2) return otp.length >= 6;
    if (step === 3)
      return (
        !!newPassword &&
        !!confirmPassword &&
        newPassword.length >= 6 &&
        newPassword === confirmPassword
      );
    return false;
  }, [step, emailAddress, otp, newPassword, confirmPassword]);

  const handleStep1 = async () => {
    setLoading(true);
    try {
      const res = await apiVendorForgotPassword({ emailAddress });
      const otpFromApi = String(res?.data?.testOtp || '').trim();
      if (/^\d{6}$/.test(otpFromApi)) {
        setTestOtp(otpFromApi);
        setOtp(otpFromApi);
        toast.success('Test OTP generated and auto-filled');
      } else {
        setTestOtp('');
        toast.success('OTP sent to your email');
      }
      setStep(2);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    setLoading(true);
    try {
      await apiVendorVerifyResetOtp({ emailAddress, otp });
      toast.success('OTP verified');
      setStep(3);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiVendorResetPassword({ emailAddress, otp, newPassword });
      toast.success('Password reset successful. Please login.');
      onBackToLogin?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (!canSubmit || loading) return;
    if (step === 1) handleStep1();
    if (step === 2) handleStep2();
    if (step === 3) handleStep3();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.10)] border border-gray-100 px-7 py-9 flex flex-col items-center relative">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect
              x="3"
              y="5"
              width="16"
              height="11"
              rx="2.5"
              stroke="white"
              strokeWidth="1.6"
              fill="none"
            />
            <path
              d="M7 5V4a4 4 0 0 1 8 0v1"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="8.5" cy="10.5" r="1" fill="white" />
            <circle cx="13.5" cy="10.5" r="1" fill="white" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-gray-900 tracking-tight">
          Rentnpay
        </span>
      </div>

      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 text-center">
        Forgot Password
      </h1>
      <p className="text-xs sm:text-sm text-gray-500 mb-5 text-center">
        {step === 1
          ? 'Enter your registered email'
          : step === 2
            ? 'Enter OTP sent to your email'
            : 'Set your new password'}
      </p>

      <div className="flex items-center gap-2 mb-7">
        <span
          className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-orange-400' : 'bg-gray-200'}`}
        />
        <span
          className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-orange-400' : 'bg-gray-200'}`}
        />
        <span
          className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-orange-400' : 'bg-gray-200'}`}
        />
      </div>

      <div className="w-full flex flex-col gap-4">
        {step === 1 ? (
          <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
            <svg
              className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Email address"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        ) : null}

        {step === 2 ? (
          <>
            {testOtp ? (
              <div className="w-full px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs text-center">
                Test OTP auto-filled for this environment.
              </div>
            ) : null}
            <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
              <svg
                className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="6-digit OTP"
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
              <svg
                className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="New password"
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
              <svg
                className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Confirm password"
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </>
        ) : null}

        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className={`w-full py-3 rounded-xl text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${
            canSubmit && !loading
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-orange-300 cursor-not-allowed'
          }`}
        >
          {loading
            ? 'Please wait...'
            : step === 1
              ? 'Send OTP'
              : step === 2
                ? 'Verify OTP'
                : 'Reset Password'}
        </button>

        <button
          onClick={onBackToLogin}
          className="text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default VendorForgotPassword;
