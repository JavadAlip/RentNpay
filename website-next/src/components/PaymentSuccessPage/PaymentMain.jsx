'use client';

import React, { useState } from 'react';
import { Clock, Upload, Camera, ShieldCheck, CheckCircle2 } from 'lucide-react';

const PaymentMain = () => {
  const orderId = '#ORD-2025-89';
  const [showKycModal, setShowKycModal] = useState(false);

  const openKyc = () => setShowKycModal(true);
  const closeKyc = () => setShowKycModal(false);

  return (
    <>
      {/* Main success page */}
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          {/* Top icon */}
          <div className="flex justify-center mb-6">
            <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          {/* Order text */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              Order Placed !
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Order <span className="font-medium">{orderId}</span> confirmed
            </p>

            <div className="mt-4 h-px bg-gray-200 max-w-sm mx-auto" />

            <p className="mt-3 text-xs sm:text-sm text-gray-700">
              🎉 Thank you for choosing Rentnpay!
            </p>
          </div>

          {/* KYC card */}
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

          {/* Go to orders button */}
          <div className="mt-6 flex justify-center">
            <button className="w-full max-w-xs sm:max-w-sm border border-gray-300 rounded-full py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-800 bg-white hover:bg-gray-50">
              Go to My Orders
            </button>
          </div>

          {/* Footer help text */}
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

      {/* KYC Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          {/* CARD: flex column + overflow hidden */}
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
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
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>
            </div>

            {/* BODY: scrollable */}
            <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* STEP 1 */}
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
                  {['Aadhaar Front', 'Aadhaar Back', 'PAN Card'].map((item) => (
                    <div
                      key={item}
                      className="border rounded-xl p-4 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg border flex items-center justify-center">
                        <Upload className="w-4 h-4 text-gray-400" />
                      </div>

                      <p className="text-xs font-medium text-gray-700">
                        {item}
                      </p>

                      <p className="text-[10px] text-gray-400 mt-1">
                        Click to upload
                      </p>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg p-3">
                  Tips: Ensure documents are clear, unblurred, and all corners
                  are visible. Accepted formats: JPG, PNG, PDF (Max 5MB).
                </div>
              </div>

              {/* STEP 2 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs">
                    2
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    Live Photo Check
                  </p>
                </div>

                <div className="border rounded-xl bg-gray-50 py-10 text-center">
                  <div className="w-20 h-20 rounded-full border mx-auto flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7 text-gray-400" />
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Please ensure your face is clearly visible
                  </p>

                  <button className="px-6 py-2 text-xs border border-orange-400 text-orange-500 rounded-full hover:bg-orange-50 flex items-center gap-2 mx-auto">
                    <Camera className="w-4 h-4" />
                    Take Selfie
                  </button>
                </div>
              </div>

              {/* Dispatch Button (disabled) */}
              <button className="w-full py-3 rounded-xl bg-gray-200 text-gray-500 text-sm font-medium cursor-not-allowed">
                Dispatch &amp; Delivery
              </button>

              {/* Security */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Your data is encrypted and safe. Verification status will be
                updated in &quot;My Orders&quot;.
              </div>

              {/* Later */}
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
