import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api/axios';

const Profile = () => {
  const { user } = useSelector((s) => s.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/orders')
      .then((r) => setOrders(r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <p><span className="text-gray-500">Name:</span> {user?.name}</p>
        <p><span className="text-gray-500">Email:</span> {user?.email}</p>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My orders</h2>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                <span className={`text-sm px-2 py-1 rounded capitalize ${order.status === 'delivered' ? 'bg-green-100' : order.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'}`}>{order.status}</span>
              </div>
              <p className="mt-2">Duration: {order.rentalDuration} days</p>
              <p className="text-gray-600">{order.address}</p>
              <p className="mt-2 font-medium">Total: ${order.products?.reduce((s, i) => s + i.pricePerDay * i.quantity * order.rentalDuration, 0).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
