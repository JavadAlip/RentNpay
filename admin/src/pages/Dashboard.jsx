import { useState, useEffect } from 'react';
import { api } from '../api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/products?limit=1'),
      api.get('/api/orders'),
      api.get('/api/users')
    ]).then(([p, o, u]) => {
      setStats({
        products: p.data?.total ?? 0,
        orders: Array.isArray(o.data) ? o.data.length : 0,
        users: Array.isArray(u.data) ? u.data.length : 0
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const cards = [
    { label: 'Total products', value: stats.products },
    { label: 'Total orders', value: stats.orders },
    { label: 'Total users', value: stats.users }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-500 text-sm">{c.label}</p>
            <p className="text-2xl font-bold text-primary mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
