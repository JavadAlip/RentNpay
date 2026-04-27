'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { Eye } from 'lucide-react';
import { apiGetVendorNotifications } from '../../../service/api';
import VendorNewOrderModal from '../Modals/VendorNewOrderModal';
import VendorReturnRequestedModal from '../Modals/VendorReturnRequestedModal';

function clearedStorageKey(vendorId) {
  const id = vendorId || 'session';
  return `vendorNotifLastClearedAt:${id}`;
}

function formatRelativeTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 45) return 'just now';
  if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} day ago`;
  return date.toLocaleDateString();
}

const VendorTopBar = () => {
  const { user, token: reduxToken } = useSelector((state) => state.vendor);
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [, bumpRelativeLabels] = useState(0);
  const wrapRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  /** Bumps when user opens the panel so badge recalculates after “mark seen” */
  const [lastClearedVersion, setLastClearedVersion] = useState(0);
  const [orderModalId, setOrderModalId] = useState(null);
  const [returnModal, setReturnModal] = useState({
    orderId: null,
    productId: null,
  });

  const vendorId = user?._id || user?.id || '';

  const loadNotifications = useCallback(async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null;
    if (!token) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const { data } = await apiGetVendorNotifications(token);
      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(list);
      const c = Number(data?.count);
      setNotificationCount(Number.isFinite(c) ? c : list.length);
    } catch (e) {
      setNotificationsError(
        e?.response?.data?.message || e?.message || 'Failed to load',
      );
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return;
    loadNotifications();
  }, [notificationsOpen, loadNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const id = setInterval(() => bumpRelativeLabels((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [notificationsOpen]);

  const fullName = mounted ? user?.fullName : '';
  const initialsName = mounted ? user?.fullName : '';

  const visibleBadgeCount = useMemo(() => {
    if (!mounted || typeof window === 'undefined') return 0;
    let clearedMs = null;
    try {
      const raw = localStorage.getItem(clearedStorageKey(vendorId));
      if (raw) {
        const t = new Date(raw).getTime();
        if (!Number.isNaN(t)) clearedMs = t;
      }
    } catch {
      clearedMs = null;
    }
    if (clearedMs == null) {
      return Math.min(Math.max(0, notificationCount), 99);
    }
    const unread = notifications.filter((n) => {
      const t = new Date(n.at).getTime();
      return !Number.isNaN(t) && t > clearedMs;
    }).length;
    return Math.min(unread, 99);
  }, [mounted, notifications, notificationCount, lastClearedVersion, vendorId]);

  const badgeText =
    visibleBadgeCount > 99 ? '99+' : String(visibleBadgeCount || '');

  const getVendorToken = useCallback(() => {
    if (reduxToken) return reduxToken;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vendorToken');
    }
    return null;
  }, [reduxToken]);

  const orderIdFromNotification = (n) => {
    if (n?.orderId) return n.orderId;
    if (typeof n?.id === 'string' && n.id.startsWith('order-')) {
      return n.id.slice('order-'.length);
    }
    return null;
  };

  const handleBellClick = () => {
    if (notificationsOpen) {
      setNotificationsOpen(false);
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          clearedStorageKey(vendorId),
          new Date().toISOString(),
        );
      } catch {
        /* ignore */
      }
    }
    setLastClearedVersion((v) => v + 1);
    setNotificationsOpen(true);
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 pl-14 md:pl-4 lg:pl-6 pr-3 sm:pr-4 lg:pr-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-20">
      {notificationsOpen && (
        <button
          type="button"
          aria-label="Close notifications"
          className="fixed inset-0 z-30 bg-black/20 md:bg-transparent"
          onClick={() => setNotificationsOpen(false)}
        />
      )}

      <div className="flex flex-col min-w-0">
        <h1 className="text-xl md:text-xl font-semibold text-black truncate">
          Vendor Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 relative" ref={wrapRef}>
          <button
            type="button"
            onClick={handleBellClick}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          >
            <span className="sr-only">Notifications</span>
            {visibleBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-h-[1.125rem] min-w-[1.125rem] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold leading-none shadow-sm">
                {badgeText}
              </span>
            )}
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
          </button>

          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="fixed left-3 right-3 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-40 md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[min(100vw-2rem,22rem)] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  Notifications
                </p>
                <span className="text-[11px] text-gray-400">
                  Last 10 updates
                </span>
              </div>
              {notificationsLoading && (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">
                  Loading…
                </p>
              )}
              {!notificationsLoading && notificationsError && (
                <p className="px-4 py-6 text-sm text-red-600 text-center">
                  {notificationsError}
                </p>
              )}
              {!notificationsLoading &&
                !notificationsError &&
                notifications.length === 0 && (
                  <p className="px-4 py-6 text-sm text-gray-500 text-center">
                    No recent activity yet.
                  </p>
                )}
              {!notificationsLoading &&
                !notificationsError &&
                notifications.length > 0 && (
                  <ul className="max-h-[min(70vh,20rem)] overflow-y-auto divide-y divide-gray-50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent">
                    {notifications.map((n) => {
                      const at = n.at != null ? new Date(n.at) : new Date(NaN);
                      const oid = orderIdFromNotification(n);
                      const showView =
                        (n.type === 'order' || n.type === 'return_request') &&
                        oid;
                      return (
                        <li key={n.id} className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {n.detail}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-1">
                                {formatRelativeTime(at)}
                              </p>
                            </div>
                            {showView ? (
                              <button
                                type="button"
                                className="shrink-0 inline-flex items-center justify-center w-8 h-8 text-[#F97316] border border-orange-200 rounded-lg bg-orange-50 hover:bg-orange-100"
                                onClick={() => {
                                  if (n.type === 'return_request') {
                                    setReturnModal({
                                      orderId: oid,
                                      productId: n.productId || null,
                                    });
                                  } else {
                                    setOrderModalId(oid);
                                  }
                                  setNotificationsOpen(false);
                                  loadNotifications();
                                }}
                                aria-label="View notification"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </div>
          )}

          <VendorNewOrderModal
            open={Boolean(orderModalId)}
            orderId={orderModalId}
            vendorIdStr={String(user?.id || user?._id || '')}
            getToken={getVendorToken}
            onClose={() => {
              setOrderModalId(null);
              loadNotifications();
            }}
          />

          <VendorReturnRequestedModal
            open={Boolean(returnModal.orderId)}
            orderId={returnModal.orderId}
            productId={returnModal.productId}
            vendorIdStr={String(user?.id || user?._id || '')}
            getToken={getVendorToken}
            onClose={() => {
              setReturnModal({ orderId: null, productId: null });
              loadNotifications();
            }}
          />

          <div className="hidden lg:flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">
                {fullName || 'User Name'}
              </p>
              <p className="text-[11px] text-gray-400">Vendor</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-semibold">
              {(initialsName || '')?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          <div className="lg:hidden w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-semibold">
            {(initialsName || '')?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default VendorTopBar;
