'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  apiGetAllAdminProducts,
  apiGetAllOrders,
  apiGetAllUsers,
  apiGetAllVendors,
} from '@/service/api';
import { buildActivityFeed } from '@/Admin/utils/activityFeed';

const AdminTopbar = ({ title = 'Admin Dashboard' }) => {
  const adminUser = useSelector((state) => state.admin.user);
  const router = useRouter();
  const [notifCount, setNotifCount] = useState(0);

  const adminEmail = useMemo(() => {
    if (adminUser?.email) return adminUser.email;
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('adminUser') || 'null');
        return stored?.email || 'admin@rentnpay.com';
      } catch {
        return 'admin@rentnpay.com';
      }
    }
    return 'admin@rentnpay.com';
  }, [adminUser]);

  const avatarLetter = (adminEmail?.trim()?.[0] || 'A').toUpperCase();

  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;

    Promise.all([
      apiGetAllUsers(token)
        .then((r) => r.data.users || [])
        .catch(() => []),
      apiGetAllVendors(token)
        .then((r) => r.data.vendors || [])
        .catch(() => []),
      apiGetAllAdminProducts(token, 'limit=100')
        .then((r) => r.data.products || [])
        .catch(() => []),
      apiGetAllOrders(token)
        .then((r) => r.data || [])
        .catch(() => []),
    ]).then(([users, vendors, products, orders]) => {
      if (!mounted) return;
      const feed = buildActivityFeed({ users, vendors, products, orders });
      const lastSeen = Number(
        sessionStorage.getItem('admin_last_seen_notif_ts') || 0,
      );
      const unread = feed.filter(
        (x) => new Date(x.createdAt || 0).getTime() > lastSeen,
      ).length;
      setNotifCount(unread);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleNotifClick = () => {
    sessionStorage.setItem('admin_last_seen_notif_ts', String(Date.now()));
    setNotifCount(0);
    router.push('/dashboard');
  };

  return (
    <header className="flex items-center justify-between pl-14 md:pl-6 pr-3 sm:pr-4 md:pr-6 py-3 md:py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 truncate">
          {title}
        </h1>
        <p className="hidden sm:block text-xs md:text-sm text-gray-500">
          {/* Real-time platform health &amp; operations */}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Live
        </button>
        <button
          onClick={handleNotifClick}
          className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300"
        >
          <span className="sr-only">Notifications</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {notifCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          ) : null}
        </button>
        <div className="hidden lg:flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700">{adminEmail}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-semibold">
            {avatarLetter}
          </div>
        </div>
        <div className="lg:hidden w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-semibold">
          {avatarLetter}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
