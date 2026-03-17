import { useState, useEffect } from 'react';
import { api } from '../api/axios';

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    api.get('/api/orders').then((r) => setOrders(r.data || [])).catch(() => setOrders([])).finally(() => setLoading(false));
  };

  useEffect(() => fetchOrders(), []);

  const updateStatus = (orderId, status) => {
    api.put(`/api/orders/${orderId}/status`, { status }).then(() => fetchOrders()).catch(() => {});
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                <p className="font-medium">{order.name}</p>
                <p className="text-sm text-gray-600">{order.user?.email}</p>
                <p className="text-sm text-gray-600">{order.address}</p>
                <p className="text-sm">Duration: {order.rentalDuration} days</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium">Items:</p>
              <ul className="text-sm text-gray-600 mt-1">
                {order.products?.map((i, idx) => (
                  <li key={idx}>{i.product?.title || 'Product'} × {i.quantity} — ${(i.pricePerDay * i.quantity * order.rentalDuration).toFixed(2)}</li>
                ))}
              </ul>
              <p className="mt-2 font-semibold">Total: ${order.products?.reduce((s, i) => s + i.pricePerDay * i.quantity * order.rentalDuration, 0).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
      {orders.length === 0 && <p className="text-center text-gray-500 py-8">No orders.</p>}
    </div>
  );
};

export default Orders;
