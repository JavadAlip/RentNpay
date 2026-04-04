'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { apiGetVendorOrders, apiUpdateVendorOrderStatus } from '@/service/api';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const statuses = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
];
const tabs = [
  'Processing',
  'Dispatched',
  'In Transit',
  'Cancelled',
  'Delivered',
  'Completed',
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const mapTabToStatuses = (tab) => {
  if (tab === 'Processing') return ['pending', 'confirmed'];
  if (tab === 'Dispatched') return ['shipped'];
  if (tab === 'In Transit') return ['shipped'];
  if (tab === 'Cancelled') return ['cancelled'];
  if (tab === 'Delivered') return ['delivered'];
  if (tab === 'Completed') return ['completed'];
  return [];
};

function lineMatchesVendor(line, vendorIdStr) {
  const p = line?.product;
  if (!p || typeof p === 'string') return false;
  const vid = p.vendorId?._id ?? p.vendorId;
  return String(vid) === vendorIdStr;
}

/** Same row shape as admin Orders, but amount / primary product are only this vendor's lines. */
function normalizeVendorOrder(order, vendorIdStr) {
  const dur = Math.max(1, Number(order.rentalDuration || 1));
  const myLines = (order.products || []).filter((l) =>
    lineMatchesVendor(l, vendorIdStr),
  );
  const amount = myLines.reduce(
    (s, i) =>
      s +
      Number(i.pricePerDay || 0) * Number(i.quantity || 0) * dur,
    0,
  );
  const primary = myLines[0];
  const product = primary?.product;
  return {
    ...order,
    amount,
    displayId: `ORD-${String(order._id).slice(-3).toUpperCase()}`,
    customerName: order.user?.fullName || order.name || '-',
    productName: product?.productName || 'Product',
    productImage: product?.image || '',
  };
}

export default function VendorOrdersPage() {
  const { user, token } = useSelector((s) => s.vendor);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [activeTab, setActiveTab] = useState('Processing');
  const [query, setQuery] = useState('');

  const vendorIdStr = String(user?.id || user?._id || '');

  const fetchOrders = useCallback(async () => {
    const authToken =
      token ||
      (typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null);
    if (!authToken) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiGetVendorOrders(authToken);
      setOrders(res.data || []);
    } catch (err) {
      setOrders([]);
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const onOrdersChanged = () => fetchOrders();
    window.addEventListener('vendor-orders-changed', onOrdersChanged);
    return () =>
      window.removeEventListener('vendor-orders-changed', onOrdersChanged);
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    const authToken =
      token ||
      (typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null);
    if (!authToken) {
      toast.error('Please login again to continue.');
      return;
    }

    setUpdatingId(orderId);
    try {
      const res = await apiUpdateVendorOrderStatus(orderId, status, authToken);
      const updated = res.data;
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? updated : o)),
      );
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    } finally {
      setUpdatingId('');
    }
  };

  const normalizedOrders = useMemo(() => {
    if (!vendorIdStr) return [];
    return (orders || []).map((o) => normalizeVendorOrder(o, vendorIdStr));
  }, [orders, vendorIdStr]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allowed = mapTabToStatuses(activeTab);
    return normalizedOrders.filter((o) => {
      const tabMatch = allowed.length ? allowed.includes(String(o.status)) : true;
      if (!tabMatch) return false;
      if (!q) return true;
      return (
        String(o.displayId).toLowerCase().includes(q) ||
        String(o.customerName).toLowerCase().includes(q) ||
        String(o.productName).toLowerCase().includes(q)
      );
    });
  }, [normalizedOrders, activeTab, query]);

  const stats = useMemo(() => {
    const processing = normalizedOrders.filter((o) =>
      ['pending', 'confirmed'].includes(String(o.status)),
    ).length;
    const totalRevenue = normalizedOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const averageOrder = normalizedOrders.length
      ? Math.round(totalRevenue / normalizedOrders.length)
      : 0;
    const urgentActions = normalizedOrders.filter((o) => {
      const isOpen = !['completed', 'cancelled'].includes(String(o.status));
      if (!isOpen) return false;
      const ageMs = Date.now() - new Date(o.createdAt || 0).getTime();
      return ageMs > 24 * 60 * 60 * 1000;
    }).length;
    return { processing, totalRevenue, averageOrder, urgentActions };
  }, [normalizedOrders]);

  const filteredTotal = useMemo(
    () => filteredOrders.reduce((s, o) => s + Number(o.amount || 0), 0),
    [filteredOrders],
  );

  const tabCounts = useMemo(() => {
    const list = normalizedOrders;
    const shipped = list.filter((x) => String(x.status) === 'shipped').length;
    return {
      Processing: list.filter((x) =>
        ['pending', 'confirmed'].includes(String(x.status)),
      ).length,
      Dispatched: shipped,
      'In Transit': shipped,
      Cancelled: list.filter((x) => String(x.status) === 'cancelled').length,
      Delivered: list.filter((x) => String(x.status) === 'delivered').length,
      Completed: list.filter((x) => String(x.status) === 'completed').length,
    };
  }, [normalizedOrders]);

  const showPackaging = (status) =>
    ['pending', 'confirmed'].includes(String(status));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f3f5f9]">
          <div className="space-y-4 sm:space-y-5 max-w-[1600px]">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500 mt-1">
                Customers who ordered your products. Amounts reflect your lines only;
                status updates apply to the full order (same as admin).
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-14">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white rounded-2xl border border-blue-100 p-4">
                    <p className="text-xs text-gray-500">Total Processing</p>
                    <p className="text-4xl font-semibold text-blue-600 mt-1">
                      {stats.processing}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-emerald-100 p-4">
                    <p className="text-xs text-gray-500">Your revenue (lines)</p>
                    <p className="text-4xl font-semibold text-emerald-600 mt-1">
                      {money(stats.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-violet-100 p-4">
                    <p className="text-xs text-gray-500">Average order</p>
                    <p className="text-4xl font-semibold text-violet-600 mt-1">
                      {money(stats.averageOrder)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-orange-100 p-4">
                    <p className="text-xs text-gray-500">Urgent actions</p>
                    <p className="text-4xl font-semibold text-orange-600 mt-1">
                      {stats.urgentActions}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border ${
                          activeTab === tab
                            ? 'bg-white border-gray-300 shadow-sm text-gray-900'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span>{tab}</span>
                        <span
                          className={`min-w-[1.5rem] h-6 px-1.5 inline-flex items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                            activeTab === tab
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tabCounts[tab] ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search orders, customers, products..."
                    className="w-full sm:max-w-md px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1060px] w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr className="text-gray-500">
                          <th className="px-4 py-3 text-left font-medium">Order ID</th>
                          <th className="px-4 py-3 text-left font-medium">Customer</th>
                          <th className="px-4 py-3 text-left font-medium">Your product</th>
                          <th className="px-4 py-3 text-left font-medium">Order Date</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Your amount</th>
                          <th className="px-4 py-3 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order._id} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {order.displayId}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {order.customerName}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {order.productImage ? (
                                  <img
                                    src={order.productImage}
                                    alt=""
                                    className="w-9 h-9 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-md bg-gray-100" />
                                )}
                                <span className="text-gray-800">{order.productName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-GB')
                                : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={order.status}
                                disabled={updatingId === order._id}
                                onChange={(e) => updateStatus(order._id, e.target.value)}
                                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs capitalize disabled:opacity-50"
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s} className="capitalize">
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {money(order.amount)}
                            </td>
                            <td className="px-4 py-3">
                              {showPackaging(order.status) ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toast.info('Packaging flow coming soon.')
                                  }
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
                                >
                                  Packaging
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {filteredOrders.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-10 text-center text-gray-500"
                            >
                              No orders found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#F97316] text-white">
                          <td colSpan={6} className="px-4 py-3 font-semibold">
                            Total (your lines)
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {money(filteredTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
