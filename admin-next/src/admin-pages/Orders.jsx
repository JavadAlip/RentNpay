'use client';

import { useEffect, useState } from 'react';
import { apiGetAllOrders, apiUpdateOrderStatus } from '@/service/api';
import { toast } from 'react-toastify';

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const fetchOrders = async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiGetAllOrders(token);
      setOrders(res.data || []);
    } catch (err) {
      setOrders([]);
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      toast.error('Please login again to continue.');
      return;
    }

    setUpdatingId(orderId);
    try {
      await apiUpdateOrderStatus(orderId, status, token);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o)),
      );
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}

        <main className="p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : (
            <>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <p className="font-medium">
                          Order #{String(order._id).slice(-8)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.user?.emailAddress || '-'}
                        </p>
                        <p className="text-sm text-gray-600">{order.address}</p>
                        <p className="text-sm">
                          Duration: {order.rentalDuration} months
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          disabled={updatingId === order._id}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-medium">Items:</p>
                      <ul className="text-sm text-gray-600 mt-1">
                        {order.products?.map((i, idx) => (
                          <li key={idx}>
                            {i.product?.productName || 'Product'} x {i.quantity} - Rs
                            {(
                              i.pricePerDay *
                              i.quantity *
                              order.rentalDuration
                            ).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 font-semibold">
                        Total: Rs
                        {order.products
                          ?.reduce(
                            (s, i) =>
                              s +
                              i.pricePerDay * i.quantity * order.rentalDuration,
                            0,
                          )
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {orders.length === 0 && (
                <p className="text-center text-gray-500 py-8">No orders.</p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Orders;
