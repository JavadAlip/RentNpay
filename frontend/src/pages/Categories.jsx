// import { useState, useEffect } from 'react';
// import { api } from '../api/axios';

// const Categories = () => {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(null);
//   const [name, setName] = useState('');
//   const [showForm, setShowForm] = useState(false);
//   const [formName, setFormName] = useState('');

//   const fetchCategories = () => {
//     api.get('/api/categories').then((r) => setCategories(r.data || [])).catch(() => []).finally(() => setLoading(false));
//   };

//   useEffect(() => fetchCategories(), []);

//   const create = async (e) => {
//     e.preventDefault();
//     if (!formName.trim()) return;
//     await api.post('/api/categories', { name: formName.trim() });
//     setFormName('');
//     setShowForm(false);
//     fetchCategories();
//   };

//   const update = async (e) => {
//     e.preventDefault();
//     if (!editing || !name.trim()) return;
//     await api.put(`/api/categories/${editing._id}`, { name: name.trim() });
//     setEditing(null);
//     setName('');
//     fetchCategories();
//   };

//   const remove = (cat) => {
//     if (!window.confirm(`Delete "${cat.name}"?`)) return;
//     api.delete(`/api/categories/${cat._id}`).then(() => fetchCategories()).catch(() => {});
//   };

//   if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
//         <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700">Create category</button>
//       </div>
//       {showForm && (
//         <form onSubmit={create} className="mb-6 flex gap-2">
//           <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Category name" className="px-4 py-2 border rounded-lg flex-1" />
//           <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Add</button>
//           <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
//         </form>
//       )}
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
//               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {categories.map((c) => (
//               <tr key={c._id}>
//                 {editing?._id === c._id ? (
//                   <td colSpan={3}>
//                     <form onSubmit={update} className="flex gap-2 p-2">
//                       <input value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2 border rounded-lg flex-1" />
//                       <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save</button>
//                       <button type="button" onClick={() => { setEditing(null); setName(''); }} className="px-4 py-2 border rounded-lg">Cancel</button>
//                     </form>
//                   </td>
//                 ) : (
//                   <>
//                     <td className="px-4 py-3 font-medium">{c.name}</td>
//                     <td className="px-4 py-3 text-gray-500">{c.slug}</td>
//                     <td className="px-4 py-3 text-right">
//                       <button onClick={() => { setEditing(c); setName(c.name); }} className="text-primary hover:underline mr-3">Edit</button>
//                       <button onClick={() => remove(c)} className="text-red-600 hover:underline">Delete</button>
//                     </td>
//                   </>
//                 )}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {categories.length === 0 && <p className="p-8 text-center text-gray-500">No categories.</p>}
//       </div>
//     </div>
//   );
// };

// export default Categories;

import { useState, useEffect } from 'react';

import { api } from '../api/axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');

  const fetchCategories = () => {
    api
      .get('/api/categories')
      .then((r) => setCategories(r.data || []))
      .catch(() => [])
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchCategories(), []);

  const create = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    await api.post('/api/categories', { name: formName.trim() });
    setFormName('');
    setShowForm(false);
    fetchCategories();
  };

  const update = async (e) => {
    e.preventDefault();
    if (!editing || !name.trim()) return;
    await api.put(`/api/categories/${editing._id}`, { name: name.trim() });
    setEditing(null);
    setName('');
    fetchCategories();
  };

  const remove = (cat) => {
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    api
      .delete(`/api/categories/${cat._id}`)
      .then(() => fetchCategories())
      .catch(() => {});
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}

        <main className="p-6 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                >
                  Create category
                </button>
              </div>

              {/* Create Category Form */}
              {showForm && (
                <form onSubmit={create} className="mb-6 flex gap-2">
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Category name"
                    className="px-4 py-2 border rounded-lg flex-1"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Categories Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Slug
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((c) => (
                      <tr key={c._id}>
                        {editing?._id === c._id ? (
                          <td colSpan={3}>
                            <form onSubmit={update} className="flex gap-2 p-2">
                              <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="px-4 py-2 border rounded-lg flex-1"
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-white rounded-lg"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(null);
                                  setName('');
                                }}
                                className="px-4 py-2 border rounded-lg"
                              >
                                Cancel
                              </button>
                            </form>
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium">{c.name}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {c.slug}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setEditing(c);
                                  setName(c.name);
                                }}
                                className="text-primary hover:underline mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => remove(c)}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categories.length === 0 && (
                  <p className="p-8 text-center text-gray-500">
                    No categories.
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Categories;
