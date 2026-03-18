import React from 'react';

const VendorWelcome = ({ onGoToDashboard, onCompleteKYC }) => {
  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.10)] border border-gray-100 px-9 py-10 flex flex-col items-center">
      {/* Green checkmark circle */}
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg
          width="30"
          height="30"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Welcome to Rentnpay!
      </h1>

      {/* Subtitle */}
      <p className="text-sm text-gray-400 text-center mb-8">
        Your partner account has been created successfully
      </p>

      {/* Promo banner */}
      <div className="w-full border border-orange-300 rounded-2xl bg-orange-50 px-5 py-4 flex items-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Zero Commission – First Month
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Start listing your inventory today!
          </p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() =>
            onGoToDashboard
              ? onGoToDashboard()
              : (window.location.href = '/vendor-dashboard')
          }
          className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
        >
          Go to Partner Dashboard
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>

        <button
          onClick={() =>
            onCompleteKYC
              ? onCompleteKYC()
              : (window.location.href = '/vendor-kyc')
          }
          className="w-full py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-[0.98] text-gray-700 text-sm font-semibold transition-all"
        >
          Complete KYC Verification
        </button>
      </div>
    </div>
  );
};

export default VendorWelcome;
