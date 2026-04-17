'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { adminLogout } from '../../redux/slices/adminSlice';
import { apiGetVendorKycQueue } from '@/service/api';

const AdminSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [kycQueueCounts, setKycQueueCounts] = useState({ pending: 0, resubmitted: 0 });
  const [kycOpen, setKycOpen] = useState(true);

  const logout = async () => {
    await dispatch(adminLogout());
    router.push('/admin-login');
  };

  const [systemOpen, setSystemOpen] = useState(true);

  const dashboardLink = { to: '/dashboard', label: 'Dashboard' };
  const links = [
    // { to: '/products', label: 'Products' },
    { to: '/categories', label: 'Categories' },
    { to: '/cart', label: 'Cart' },
    { to: '/wishlist', label: 'Wishlist' },
    { to: '/orders', label: 'Orders' },
    { to: '/all-vendors', label: 'Vendors' },
    { to: '/users', label: 'Users' },
  ];

  const systemChild = {
    to: '/custom-listings',
    label: 'Custom Listings',
  };

  const systemTicketsChild = {
    to: '/system/tickets',
    label: 'Tickets',
  };

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;
    apiGetVendorKycQueue(token)
      .then((r) => {
        const c = r.data?.counts || {};
        setKycQueueCounts({
          pending: c.pending || 0,
          resubmitted: c.resubmitted || 0,
        });
      })
      .catch(() => setKycQueueCounts({ pending: 0, resubmitted: 0 }));
  }, []);

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
        className={`fixed md:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-200 flex flex-col min-h-screen w-56 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${sidebarOpen ? 'md:w-56' : 'md:w-16'}`}
      >
        <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              R
            </div>
            {sidebarOpen ? (
              <div className="leading-tight min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Rentnpay
                </p>
                <p className="text-[11px] text-gray-500">Admin Portal</p>
              </div>
            ) : null}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:inline-flex p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          <Link
            href={dashboardLink.to}
            onClick={() => setMobileOpen(false)}
            className={`mx-2 px-3 py-2 rounded-lg text-sm flex items-center text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
              pathname === dashboardLink.to
                ? 'bg-orange-50 text-orange-600 font-medium'
                : ''
            }`}
            title={dashboardLink.label}
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              {sidebarOpen ? dashboardLink.label : dashboardLink.label.charAt(0)}
            </span>
          </Link>

          <div className="mx-2 mt-1">
            <button
              type="button"
              onClick={() => setKycOpen((v) => !v)}
              className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                pathname?.startsWith('/kyc')
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : ''
              }`}
              title="KYC"
            >
              <span className="inline-flex items-center gap-2">
                {sidebarOpen ? 'KYC' : 'K'}
                {sidebarOpen &&
                kycQueueCounts.pending + kycQueueCounts.resubmitted > 0 ? (
                  <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {kycQueueCounts.pending + kycQueueCounts.resubmitted > 9
                      ? '9+'
                      : kycQueueCounts.pending + kycQueueCounts.resubmitted}
                  </span>
                ) : null}
              </span>
              {sidebarOpen ? (
                <span className="text-xs text-gray-400">{kycOpen ? '▼' : '▶'}</span>
              ) : null}
            </button>
            {sidebarOpen && kycOpen ? (
              <div className="mt-1 ml-2 space-y-0.5">
                <Link
                  href="/kyc/vendor"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === '/kyc/vendor' || pathname?.startsWith('/kyc/vendor/')
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  Vendor
                </Link>
                <Link
                  href="/kyc/customer"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === '/kyc/customer'
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  Customer
                </Link>
              </div>
            ) : null}
          </div>

          {links.map((l) => {
            const isActive = pathname === l.to;
            return (
              <Link
                key={l.to}
                href={l.to}
                onClick={() => setMobileOpen(false)}
                className={`mx-2 px-3 py-2 rounded-lg text-sm flex items-center text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                  isActive ? 'bg-orange-50 text-orange-600 font-medium' : ''
                }`}
                title={l.label}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  {sidebarOpen ? l.label : l.label.charAt(0)}
                </span>
              </Link>
            );
          })}

          <div className="mx-2 mt-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setSystemOpen((v) => !v)}
              className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                pathname === systemChild.to
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : ''
              }`}
              title="System"
            >
              <span>{sidebarOpen ? 'System' : 'S'}</span>
              {sidebarOpen ? (
                <span className="text-xs text-gray-400">
                  {systemOpen ? '▼' : '▶'}
                </span>
              ) : null}
            </button>
            {sidebarOpen && systemOpen ? (
              <div className="mt-1 ml-2 space-y-0.5">
                <Link
                  href={systemChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === systemChild.to
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {systemChild.label}
                </Link>
                <Link
                  href={systemTicketsChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === systemTicketsChild.to ||
                    pathname?.startsWith('/system/tickets')
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {systemTicketsChild.label}
                </Link>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
          >
            <span>⏻</span>
            {sidebarOpen ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
