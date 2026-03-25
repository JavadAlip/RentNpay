// import { useState, useEffect } from 'react';
// import { api } from '../api/axios';

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     api.get('/api/users').then((r) => setUsers(r.data || [])).catch(() => setUsers([])).finally(() => setLoading(false));
//   }, []);

//   if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

//   return (
//     <div>
//       <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {users.map((u) => (
//               <tr key={u._id}>
//                 <td className="px-4 py-3 font-medium">{u.name}</td>
//                 <td className="px-4 py-3">{u.email}</td>
//                 <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-gray-100">{u.role}</span></td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {users.length === 0 && <p className="p-8 text-center text-gray-500">No users.</p>}
//       </div>
//     </div>
//   );
// };

// export default Users;

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllUsers } from '@/redux/slices/adminSlice';
import Link from 'next/link';

const Users = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, error } = useSelector((state) => state.admin);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users || []).filter((u) => {
      const matchSearch =
        !q ||
        String(u.fullName || '')
          .toLowerCase()
          .includes(q) ||
        String(u.emailAddress || '')
          .toLowerCase()
          .includes(q) ||
        String(u._id || '')
          .toLowerCase()
          .includes(q);

      if (!matchSearch) return false;
      if (filterType === 'top') return Number(u.ordersCount || 0) >= 2;
      if (filterType === 'new') {
        if (!u.createdAt) return false;
        const age = Date.now() - new Date(u.createdAt).getTime();
        return age <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [users, query, filterType]);

  const stats = useMemo(() => {
    const list = users || [];
    const totalCustomers = list.length;
    const topCustomers = list.filter((u) => Number(u.ordersCount || 0) >= 2).length;
    const totalOrders = list.reduce((s, u) => s + Number(u.ordersCount || 0), 0);
    const totalItems = list.reduce((s, u) => s + Number(u.itemsCount || 0), 0);
    const avgTenureMonths = totalCustomers
      ? Math.round(
          list.reduce((s, u) => {
            if (!u.createdAt) return s;
            const months = Math.max(
              0,
              Math.floor(
                (Date.now() - new Date(u.createdAt).getTime()) /
                  (30 * 24 * 60 * 60 * 1000),
              ),
            );
            return s + months;
          }, 0) / totalCustomers,
        )
      : 0;
    return { totalCustomers, topCustomers, totalOrders, totalItems, avgTenureMonths };
  }, [users]);

  if (usersLoading) {
    return (
      <div className="flex justify-center py-14">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track customer lifecycle with dynamic platform data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-5">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-3xl font-semibold text-blue-700 mt-2">
            {stats.totalCustomers}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-4 sm:p-5">
          <p className="text-sm text-gray-500">Top Customers</p>
          <p className="text-3xl font-semibold text-orange-600 mt-2">
            {stats.topCustomers}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 sm:p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">
            {stats.totalOrders.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-violet-100 p-4 sm:p-5">
          <p className="text-sm text-gray-500">Avg. Tenure</p>
          <p className="text-3xl font-semibold text-violet-600 mt-2">
            {stats.avgTenureMonths} mos
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or id..."
            className="w-full sm:max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Customers</option>
            <option value="top">Top Customers</option>
            <option value="new">New (Last 30 days)</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Customer ID</th>
                <th className="px-4 py-3 text-left font-medium">Customer Profile</th>
                <th className="px-4 py-3 text-left font-medium">Tenure</th>
                <th className="px-4 py-3 text-left font-medium">Orders</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Avg Items/Order</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, index) => {
                const orders = Number(u.ordersCount || 0);
                const items = Number(u.itemsCount || 0);
                const avg = orders ? (items / orders).toFixed(1) : '0.0';
                return (
                  <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">
                      CUST-{String(index + 1).padStart(3, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{u.fullName || '-'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{u.emailAddress || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{orders}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{items}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{avg}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/users/${u._id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No users found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white">
                <td className="px-4 py-3 font-semibold" colSpan={3}>
                  GRAND TOTAL
                </td>
                <td className="px-4 py-3 font-semibold">
                  {stats.totalOrders.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 font-semibold text-blue-200">
                  {stats.totalItems.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-300">
                  {stats.totalOrders
                    ? (stats.totalItems / stats.totalOrders).toFixed(1)
                    : '0.0'}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
