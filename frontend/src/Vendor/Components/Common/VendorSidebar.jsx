import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { vendorLogout } from '../../../redux/slices/vendorSlice';

const navItems = [
  // { to: '/vendor/kyc', label: 'KYC & Verification' },
  { to: '/vendor-dashboard', label: 'Dashboard' },
  { to: '/vendor-products', label: 'Products' },
  { to: '/vendor/orders', label: 'Orders' },
  { to: '/vendor/customers', label: 'Customers' },
  { to: '/vendor/tickets', label: 'Tickets' },
  { to: '/vendor/offers', label: 'Offers' },
  { to: '/vendor/finances', label: 'Finances' },
  { to: '/vendor/earnings', label: 'Earnings & Payouts' },
  { to: '/vendor/ads', label: 'Ads Plans' },
  { to: '/vendor/loans', label: 'Loans' },
  { to: '/vendor/settings', label: 'Settings' },
];

const VendorSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(vendorLogout());
    navigate('/vendor-main', { replace: true });
  };

  return (
    <aside className="hidden md:flex md:flex-col w-60 bg-white border-r border-gray-200 min-h-screen">
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
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `mx-2 px-3 py-2 rounded-lg text-sm flex items-center text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                isActive ? 'bg-orange-50 text-orange-600 font-medium' : ''
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4 flex items-center justify-between text-xs text-gray-600">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-red-500 hover:text-red-600"
        >
          <span>⏻</span>
          <span>Log Out</span>
        </button>
        <button className="text-gray-500 hover:text-gray-700">Profile</button>
      </div>
    </aside>
  );
};

export default VendorSidebar;
