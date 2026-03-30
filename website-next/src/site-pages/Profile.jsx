'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { apiGetMyOrders, apiGetMyWishlist } from '@/lib/api';

const Profile = () => {
  const { user } = useSelector((s) => s.auth);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGetMyOrders()
      .then((r) => setOrders(r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setWishlistLoading(true);
    apiGetMyWishlist()
      .then((r) => setWishlist(r.data?.items || []))
      .catch(() => setWishlist([]))
      .finally(() => setWishlistLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <p>
          <span className="text-gray-500">Name:</span> {user?.name}
        </p>
        <p>
          <span className="text-gray-500">Email:</span> {user?.email}
        </p>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My orders</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border border-gray-200 rounded-xl p-4"
            >
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <span
                  className={`text-sm px-2 py-1 rounded capitalize ${order.status === 'delivered' ? 'bg-green-100' : order.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="mt-2">Duration: {order.rentalDuration} days</p>
              <p className="text-gray-600">{order.address}</p>
              <p className="mt-2 font-medium">
                Total: $
                {order.products
                  ?.reduce(
                    (s, i) =>
                      s + i.pricePerDay * i.quantity * order.rentalDuration,
                    0,
                  )
                  .toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-900 mt-10 mb-4">My wishlist</h2>
      {wishlistLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : wishlist.length === 0 ? (
        <p className="text-gray-500">No wishlist items yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((p) => (
            <div key={p._id} className="border border-gray-200 rounded-xl p-3">
              <img
                src={p.image || p.images?.[0] || 'https://placehold.co/300x200'}
                alt={p.productName}
                className="w-full h-32 object-cover rounded-lg mb-2"
              />
              <p className="font-medium text-gray-900">{p.productName}</p>
              <p className="text-xs text-gray-500">{p.category}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{p.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
