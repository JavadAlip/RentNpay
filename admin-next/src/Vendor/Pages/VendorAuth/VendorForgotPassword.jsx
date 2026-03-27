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
      await apiVendorForgotPassword({ emailAddress });
      toast.success('OTP sent to your email');
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

      <div className="w-full flex flex-col gap-4">
        {step === 1 ? (
          <input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Email address"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          />
        ) : null}

        {step === 2 ? (
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit OTP"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          />
        ) : null}

        {step === 3 ? (
          <>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </>
        ) : null}

        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className={`w-full py-3 rounded-xl text-white text-sm font-semibold ${
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

