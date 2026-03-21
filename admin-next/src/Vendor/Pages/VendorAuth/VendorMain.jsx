'use client';

import React, { useState } from 'react';
import VendorLogin from './VendorLogin';
import VendorSignup from './VendorSignup';
import VendorOtpVerification from './VendorOtpVerification';
import VendorWelcome from './VendorWelcome';

const VendorMain = () => {
  const [modal, setModal] = useState(null);
  const [otpEmail, setOtpEmail] = useState('');

  const closeModal = () => setModal(null);

  const modalContent = () => {
    switch (modal) {
      case 'login':
        return (
          <VendorLogin
            onClose={closeModal}
            onSignup={() => setModal('signup')}
          />
        );
      case 'signup':
        return (
          <VendorSignup
            onClose={closeModal}
            onSignIn={() => setModal('login')}
            onSuccess={(email) => {
              setOtpEmail(email);
              setModal('otp');
            }}
          />
        );
      case 'otp':
        return (
          <VendorOtpVerification
            email={otpEmail}
            onChangeEmail={() => setModal('signup')}
            onSuccess={() => setModal('welcome')}
          />
        );
      case 'welcome':
        return (
          <VendorWelcome
            onGoToDashboard={() => (window.location.href = '/vendor-dashboard')}
            onCompleteKYC={() => (window.location.href = '/vendor-kyc')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              R
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900">
                Rentnpay Partner
              </p>
              <p className="text-xs text-gray-500">Vendor Portal</p>
            </div>
          </div>
          <button
            className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900"
            onClick={() => setModal('login')}
          >
            Already a Partner? <span className="text-blue-600">Sign In</span>
          </button>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 lg:px-6 pt-10 lg:pt-16 pb-10 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 mb-3">
                Rentnpay Partner
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight mb-4">
                Grow your Rental
                <br className="hidden sm:block" />
                Business with <span className="text-gray-900">Rentnpay.</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-lg">
                Join 500+ local vendors. Zero commission for the first month.
              </p>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-lg">
                <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 sm:py-2.5 flex-1 gap-2">
                  <div className="flex items-center gap-1 text-gray-700 text-sm">
                    <span className="text-xs">+91</span>
                    <span className="w-px h-4 bg-gray-300" />
                  </div>
                  <input
                    type="tel"
                    placeholder="7745665205"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={() => setModal('signup')}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium shadow-sm"
                >
                  Start Selling
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs text-gray-500">
                <span>✓ Free to join</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>✓ Quick approval</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>✓ No hidden charges</span>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-sm border border-gray-100">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xs leading-tight">
                  <p className="font-medium text-gray-900">500+ Vendors</p>
                  <p className="text-gray-500 text-[11px]">Already growing</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-[0_18px_55px_rgba(15,23,42,0.22)] bg-gray-200 aspect-[4/3] sm:aspect-[5/3] lg:aspect-[4/3]">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url("https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg?auto=compress&cs=tinysrgb&w=1200")',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why Partner section */}
        <section className="bg-gray-50 border-t border-gray-100 py-10 lg:py-14">
          <div className="max-w-6xl mx-auto px-4 lg:px-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center mb-8">
              Why Partner with Us?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 text-lg">$</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                  Guaranteed Payments
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  On-time monthly payouts with transparent settlement reports.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <span className="text-blue-600 text-lg">👤</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                  Verified Customers
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  KYC-checked tenants to ensure only safe and reliable
                  transactions.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                  <span className="text-orange-500 text-lg">🚚</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                  Logistics Support
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  We handle pickup &amp; drop for hassle-free rental operations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Single centered modal overlay */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            backgroundColor: 'rgba(15,23,42,0.45)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={closeModal}
        >
          <div onClick={(e) => e.stopPropagation()}>{modalContent()}</div>
        </div>
      )}
    </div>
  );
};

export default VendorMain;
