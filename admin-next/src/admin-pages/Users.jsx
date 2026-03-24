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

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllUsers } from '@/redux/slices/adminSlice';

const Users = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  if (usersLoading) {
    return <div className="p-6 text-sm text-gray-600">Loading users...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">All Users</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-gray-500">
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">Order Items</th>
              <th className="px-4 py-2 text-left font-medium">Orders</th>
              <th className="px-4 py-2 text-right font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-800">{u.fullName}</td>
                <td className="px-4 py-2 text-gray-600">{u.emailAddress}</td>
                <td className="px-4 py-2 text-gray-700 font-medium">
                  {u.itemsCount ?? 0}
                </td>
                <td className="px-4 py-2 text-gray-700 font-medium">
                  {u.ordersCount ?? 0}
                </td>
                <td className="px-4 py-2 text-right text-gray-500 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500 text-sm"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
