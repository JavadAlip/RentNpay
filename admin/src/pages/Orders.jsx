import { useState } from 'react';

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const Orders = () => {
  const [orders, setOrders] = useState([
    {
      _id: '1',
      name: 'Order #101',
      createdAt: new Date().toISOString(),
      user: { email: 'javad@example.com' },
      address: '123 Main St, Pune',
      rentalDuration: 3,
      status: 'pending',
      products: [
        { product: { title: 'Fabric Sofa' }, quantity: 1, pricePerDay: 50 },
        { product: { title: 'Dining Table' }, quantity: 2, pricePerDay: 30 },
      ],
    },
    {
      _id: '2',
      name: 'Order #102',
      createdAt: new Date().toISOString(),
      user: { email: 'kaushik@example.com' },
      address: '456 Park Lane, Pune',
      rentalDuration: 5,
      status: 'shipped',
      products: [
        { product: { title: 'Office Chair' }, quantity: 3, pricePerDay: 20 },
      ],
    },
  ]);

  const updateStatus = (orderId, status) => {
    // For static demo, just update locally
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status } : o)),
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}

        <main className="p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
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
                    <p className="font-medium">{order.name}</p>
                    <p className="text-sm text-gray-600">{order.user?.email}</p>
                    <p className="text-sm text-gray-600">{order.address}</p>
                    <p className="text-sm">
                      Duration: {order.rentalDuration} days
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
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
                        {i.product?.title || 'Product'} × {i.quantity} — $
                        {(
                          i.pricePerDay *
                          i.quantity *
                          order.rentalDuration
                        ).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-semibold">
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
              </div>
            ))}
          </div>
          {orders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No orders.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default Orders;
