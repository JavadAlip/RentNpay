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

import { useState } from 'react';

const Users = () => {
  const [users] = useState([
    { _id: '1', name: 'Javad Ali', email: 'javad@example.com', role: 'Admin' },
    {
      _id: '2',
      name: 'Kaushik Sharma',
      email: 'kaushik@example.com',
      role: 'Vendor',
    },
    {
      _id: '3',
      name: 'Rohit Kumar',
      email: 'rohit@example.com',
      role: 'Customer',
    },
  ]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}

        <main className="p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100">
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="p-8 text-center text-gray-500">No users.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Users;
