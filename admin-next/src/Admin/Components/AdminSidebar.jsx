'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { adminLogout } from '../../redux/slices/adminSlice';
import { apiGetVendorKycQueue } from '@/service/api';
import { ChevronDown, ChevronRight } from 'lucide-react';
import dashboardIcon from '@/assets/icons/dashboard.png';
import storeIcon from '@/assets/icons/store1.png';
import cartIcon from '@/assets/icons/cart1.png';
import ordersIcon from '@/assets/icons/orders1.png';
import reminderIcon from '@/assets/icons/reminder1.png';
import peopleIcon from '@/assets/icons/people.png';
import kycIcon from '@/assets/icons/kyc1.png';
import analyticsIcon from '@/assets/icons/analytics.png';
import productOffersIcon from '@/assets/icons/prodcutoffers.png';
import systemsIcon from '@/assets/icons/systems.png';

const AdminSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [kycQueueCounts, setKycQueueCounts] = useState({
    pending: 0,
    resubmitted: 0,
  });
  const [kycOpen, setKycOpen] = useState(true);

  const logout = async () => {
    await dispatch(adminLogout());
    router.push('/admin-login');
  };

  const [systemOpen, setSystemOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [productsOffersOpen, setProductsOffersOpen] = useState(true);

  const dashboardLink = { to: '/dashboard', label: 'Dashboard' };
  const analyticsFinancialChild = {
    to: '/analytics/financial-performance',
    label: 'Financial Performance',
  };
  const analyticsOrdersChild = {
    to: '/analytics/order-analytics',
    label: 'Order Analytics',
  };
  const analyticsCitiesChild = {
    to: '/analytics/cities',
    label: 'Cities',
  };
  const offersChild = { to: '/products-offers', label: 'Offers' };
  const globalProductsChild = {
    to: '/global-products',
    label: 'Global Product',
  };
  const links = [
    // { to: '/products', label: 'Products' },
    { to: '/stores', label: 'Stores', icon: storeIcon },
    { to: '/cart', label: 'Cart', icon: cartIcon },
    { to: '/wishlist', label: 'Wishlist', icon: cartIcon },
    { to: '/orders', label: 'Orders', icon: ordersIcon },
    { to: '/reminders', label: 'Reminders', icon: reminderIcon },
    { to: '/all-vendors', label: 'Vendors', icon: peopleIcon },
    { to: '/users', label: 'Users', icon: peopleIcon },
  ];

  const systemChild = {
    to: '/custom-listings',
    label: 'Custom Listings',
  };

  const systemTicketsChild = {
    to: '/system/tickets',
    label: 'Tickets',
  };
  const systemApprovalChild = {
    to: '/system/approval',
    label: 'Approval',
  };
  const systemCategoriesChild = {
    to: '/categories',
    label: 'Categories',
  };

  useEffect(() => {
    if (pathname?.startsWith('/analytics')) setAnalyticsOpen(true);
  }, [pathname]);
  useEffect(() => {
    if (
      pathname === '/products-offers' ||
      pathname?.startsWith('/global-products')
    ) {
      setProductsOffersOpen(true);
    }
  }, [pathname]);

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
          {(() => {
            const isDashboardActive = pathname === dashboardLink.to;
            return (
              <Link
                href={dashboardLink.to}
                onClick={() => setMobileOpen(false)}
                className={`mx-2 px-3 py-2 rounded-lg text-sm flex items-center text-gray-600  ${
                  isDashboardActive
                    ? 'bg-[#FF7020] text-white font-medium shadow-sm'
                    : ''
                }`}
                title={dashboardLink.label}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <img
                    src={dashboardIcon.src}
                    alt="Dashboard"
                    className={`w-4 h-4 shrink-0 ${isDashboardActive ? 'brightness-0 invert' : ''}`}
                  />
                  {sidebarOpen
                    ? dashboardLink.label
                    : dashboardLink.label.charAt(0)}
                </span>
              </Link>
            );
          })()}

          <div className="mx-2 mt-1">
            {(() => {
              const isAnalyticsActive = pathname?.startsWith('/analytics');
              return (
                <button
                  type="button"
                  onClick={() => setAnalyticsOpen((v) => !v)}
                  className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between text-gray-600 ${
                    isAnalyticsActive
                      ? 'bg-[#FF7020] text-white font-medium shadow-sm'
                      : ''
                  }`}
                  title="Analytics"
                >
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={analyticsIcon.src}
                      alt="Analytics"
                      className={`w-4 h-4 shrink-0 ${isAnalyticsActive ? 'brightness-0 invert' : ''}`}
                    />
                    {sidebarOpen ? 'Analytics' : 'A'}
                  </span>
                  {/* {sidebarOpen ? (
                <span className="text-xs text-gray-400">
                  {analyticsOpen ? '▼' : '▶'}
                </span>
              ) : null} */}
                  {sidebarOpen ? (
                    analyticsOpen ? (
                      <ChevronDown
                        size={18}
                        className={
                          isAnalyticsActive
                            ? 'text-white fill-white'
                            : 'text-gray-400 fill-gray-400'
                        }
                      />
                    ) : (
                      <ChevronRight
                        size={18}
                        className={
                          isAnalyticsActive
                            ? 'text-white fill-white'
                            : 'text-gray-400 fill-gray-400'
                        }
                      />
                    )
                  ) : null}
                </button>
              );
            })()}
            {sidebarOpen && analyticsOpen ? (
              <div className="mt-1 ml-2 space-y-0.5">
                <Link
                  href={analyticsFinancialChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === analyticsFinancialChild.to ||
                    pathname?.startsWith(`${analyticsFinancialChild.to}/`)
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {analyticsFinancialChild.label}
                </Link>
                <Link
                  href={analyticsOrdersChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === analyticsOrdersChild.to ||
                    pathname?.startsWith(`${analyticsOrdersChild.to}/`)
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {analyticsOrdersChild.label}
                </Link>
                <Link
                  href={analyticsCitiesChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === analyticsCitiesChild.to ||
                    pathname?.startsWith(`${analyticsCitiesChild.to}/`)
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {analyticsCitiesChild.label}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mx-2 mt-1">
            {(() => {
              const isProductsOffersActive =
                pathname === offersChild.to ||
                pathname?.startsWith('/global-products');
              return (
                <button
                  type="button"
                  onClick={() => setProductsOffersOpen((v) => !v)}
                  className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between text-gray-600 ${
                    isProductsOffersActive
                      ? 'bg-[#FF7020] text-white font-medium shadow-sm'
                      : ''
                  }`}
                  title="Products & Offers"
                >
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={productOffersIcon.src}
                      alt="Products & Offers"
                      className={`w-4 h-4 shrink-0 ${isProductsOffersActive ? 'brightness-0 invert' : ''}`}
                    />
                    {sidebarOpen ? 'Products & Offers' : 'P'}
                  </span>
                  {/* {sidebarOpen ? (
                <span className="text-xs text-gray-400">
                  {productsOffersOpen ? '▼' : '▶'}
                </span>
              ) : null} */}
                  {sidebarOpen ? (
                    productsOffersOpen ? (
                      <ChevronDown
                        size={18}
                        className={
                          isProductsOffersActive
                            ? 'text-white fill-white'
                            : 'text-gray-400 fill-gray-400'
                        }
                      />
                    ) : (
                      <ChevronRight
                        size={18}
                        className={
                          isProductsOffersActive
                            ? 'text-white fill-white'
                            : 'text-gray-400 fill-gray-400'
                        }
                      />
                    )
                  ) : null}
                </button>
              );
            })()}
            {sidebarOpen && productsOffersOpen ? (
              <div className="mt-1 ml-2 space-y-0.5">
                <Link
                  href={offersChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === offersChild.to
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {offersChild.label}
                </Link>
                <Link
                  href={globalProductsChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === globalProductsChild.to
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {globalProductsChild.label}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mx-2 mt-1">
            {(() => {
              const isKycActive = pathname?.startsWith('/kyc');
              return (
                <button
                  type="button"
                  onClick={() => setKycOpen((v) => !v)}
                  className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between text-gray-600 ${
                    isKycActive
                      ? 'bg-[#FF7020] text-white font-medium shadow-sm'
                      : ''
                  }`}
                  title="KYC"
                >
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={kycIcon.src}
                      alt="KYC"
                      className={`w-4 h-4 shrink-0 ${isKycActive ? 'brightness-0 invert' : ''}`}
                    />
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
                  {/* {sidebarOpen ? (
                <span className="text-xs text-gray-400">{kycOpen ? '▼' : '▶'}</span>
              ) : null} */}
                  {sidebarOpen ? (
                    kycOpen ? (
                      <ChevronDown
                        size={18}
                        className={
                          isKycActive
                            ? 'text-white fill-white'
                            : 'text-gray-400 fill-gray-400'
                        }
                      />
                    ) : (
                      <ChevronRight
                        size={18}
                        className={
                          isKycActive
                            ? 'text-white fill-white'
                            : 'text-gray-400 fill-gray-400'
                        }
                      />
                    )
                  ) : null}
                </button>
              );
            })()}
            {sidebarOpen && kycOpen ? (
              <div className="mt-1 ml-2 space-y-0.5">
                <Link
                  href="/kyc/vendor"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === '/kyc/vendor' ||
                    pathname?.startsWith('/kyc/vendor/')
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
                  isActive
                    ? 'bg-[#FF7020] text-white font-medium shadow-sm'
                    : ''
                }`}
                title={l.label}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  {l.icon ? (
                    <img
                      src={l.icon.src}
                      alt={l.label}
                      className={`w-4 h-4 shrink-0 ${isActive ? 'brightness-0 invert' : ''}`}
                    />
                  ) : null}
                  {sidebarOpen ? l.label : l.label.charAt(0)}
                </span>
              </Link>
            );
          })}

          <div className="mx-2 mt-2 pt-2 border-t border-gray-100">
            {(() => {
              const isSystemActive =
                pathname === systemChild.to ||
                pathname === systemTicketsChild.to ||
                pathname?.startsWith('/system/tickets') ||
                pathname === systemApprovalChild.to ||
                pathname?.startsWith('/system/approval') ||
                pathname === systemCategoriesChild.to;
              return (
                <button
                  type="button"
                  onClick={() => setSystemOpen((v) => !v)}
                  className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    isSystemActive
                      ? 'bg-[#FF7020] text-white font-medium shadow-sm'
                      : ''
                  }`}
                  title="System"
                >
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={systemsIcon.src}
                      alt="System"
                      className={`w-4 h-4 shrink-0 ${isSystemActive ? 'brightness-0 invert' : ''}`}
                    />
                    {sidebarOpen ? 'System' : 'S'}
                  </span>
                  {/* {sidebarOpen ? (
                <span className="text-xs text-gray-400">
                  {systemOpen ? '▼' : '▶'}
                </span>
              ) : null} */}
                  {sidebarOpen ? (
                    systemOpen ? (
                      <ChevronDown
                        size={18}
                        className={
                          isSystemActive
                            ? 'text-white fill-white'
                            : 'text-gray-400 fill-gray-400'
                        }
                      />
                    ) : (
                      <ChevronRight
                        size={18}
                        className={
                          isSystemActive
                            ? 'text-white fill-white'
                            : 'text-gray-400 fill-gray-400'
                        }
                      />
                    )
                  ) : null}
                </button>
              );
            })()}
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
                <Link
                  href={systemApprovalChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === systemApprovalChild.to ||
                    pathname?.startsWith('/system/approval')
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {systemApprovalChild.label}
                </Link>
                <Link
                  href={systemCategoriesChild.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 ${
                    pathname === systemCategoriesChild.to
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : ''
                  }`}
                >
                  {systemCategoriesChild.label}
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
