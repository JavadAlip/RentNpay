'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { vendorLogout } from '../../../redux/slices/vendorSlice';
import dashboardIcon from '@/assets/icons/dashboard.png';
import kycIcon from '@/assets/icons/kyc.png';
import storesIcon from '@/assets/icons/stores.png';
import productsIcon from '@/assets/icons/products.png';
import ordersIcon from '@/assets/icons/orders.png';
import customersIcon from '@/assets/icons/customers.png';
import ticketsIcon from '@/assets/icons/tickets.png';
import offersIcon from '@/assets/icons/offers.png';

const navItems = [
  { to: '/vendor-dashboard', label: 'Dashboard' },
  { to: '/vendor-kyc-status', label: 'KYC & Verification' },
  { to: '/vendor/stores', label: 'Stores' },
  { to: '/vendor-products', label: 'Products' },
  { to: '/vendor/orders', label: 'Orders' },
  { to: '/vendor/customers', label: 'Customers' },
  { to: '/vendor/tickets', label: 'Tickets' },
  { to: '/vendor/offers', label: 'Offers' },
];

const VendorSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await dispatch(vendorLogout());
    router.replace('/vendor-main');
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {mobileOpen ? (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 min-h-screen transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
            R
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-900">Rentnpay</p>
            <p className="text-[11px] text-gray-500">Vendor Portal</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.to ||
              (item.to === '/vendor/orders' &&
                pathname?.startsWith('/vendor/orders'));
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={() => setMobileOpen(false)}
                className={`mx-2 px-3 py-2 rounded-lg text-sm flex items-center transition-colors ${
                  isActive
                    ? 'bg-[#FF7020] text-white font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {item.label === 'Dashboard' ? (
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={dashboardIcon.src}
                      alt="Dashboard"
                      className={`w-4 h-4 object-contain ${
                        isActive ? 'brightness-0 invert' : ''
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                ) : item.label === 'KYC & Verification' ? (
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={kycIcon.src}
                      alt="KYC & Verification"
                      className={`w-4 h-4 object-contain ${
                        isActive ? 'brightness-0 invert' : ''
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                ) : item.label === 'Stores' ? (
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={storesIcon.src}
                      alt="Stores"
                      className={`w-4 h-4 object-contain ${
                        isActive ? 'brightness-0 invert' : ''
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                ) : item.label === 'Products' ? (
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={productsIcon.src}
                      alt="Products"
                      className={`w-4 h-4 object-contain ${
                        isActive ? 'brightness-0 invert' : ''
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                ) : item.label === 'Orders' ? (
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={ordersIcon.src}
                      alt="Orders"
                      className={`w-4 h-4 object-contain ${
                        isActive ? 'brightness-0 invert' : ''
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                ) : item.label === 'Customers' ? (
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={customersIcon.src}
                      alt="Customers"
                      className={`w-4 h-4 object-contain ${
                        isActive ? 'brightness-0 invert' : ''
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                ) : item.label === 'Tickets' ? (
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={ticketsIcon.src}
                      alt="Tickets"
                      className={`w-4 h-4 object-contain ${
                        isActive ? 'brightness-0 invert' : ''
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                ) : item.label === 'Offers' ? (
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={offersIcon.src}
                      alt="Offers"
                      className={`w-4 h-4 object-contain ${
                        isActive ? 'brightness-0 invert' : ''
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                ) : (
                  item.label
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4 flex items-center justify-between text-xs text-gray-600">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-red-500 hover:text-red-600"
          >
            {/* <span>⏻</span> */}
            <span>Log Out</span>
          </button>
          {/* <button className="text-gray-500 hover:text-gray-700">Profile</button> */}
        </div>
      </aside>
    </>
  );
};

export default VendorSidebar;
