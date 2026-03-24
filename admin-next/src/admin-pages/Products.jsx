// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { api } from '../api/axios';

// const Products = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchProducts = () => {
//     api.get('/api/products?limit=100').then((r) => {
//       setProducts(r.data.products || []);
//     }).catch(() => setProducts([])).finally(() => setLoading(false));
//   };

//   useEffect(() => fetchProducts(), []);

//   const deleteProduct = (id) => {
//     if (!window.confirm('Delete this product?')) return;
//     api.delete(`/api/products/${id}`).then(() => fetchProducts()).catch(() => {});
//   };

//   const imgSrc = (p) => {
//     const src = p.images?.[0];
//     return src?.startsWith('http') ? src : (src ? '' + src : 'https://via.placeholder.com/80');
//   };

//   if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">Products</h1>
//         <Link to="/products/new" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700">Add product</Link>
//       </div>
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/day</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
//               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {products.map((p) => (
//               <tr key={p._id}>
//                 <td className="px-4 py-3"><img src={imgSrc(p)} alt="" className="w-12 h-12 object-cover rounded" onError={(e) => { e.target.src = 'https://via.placeholder.com/80'; }} /></td>
//                 <td className="px-4 py-3 font-medium">{p.title}</td>
//                 <td className="px-4 py-3">${p.pricePerDay}</td>
//                 <td className="px-4 py-3">{p.category?.name || '—'}</td>
//                 <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${p.availability === 'available' ? 'bg-green-100' : 'bg-gray-100'}`}>{p.availability}</span></td>
//                 <td className="px-4 py-3 text-right">
//                   <Link to={`/products/${p._id}`} className="text-primary hover:underline mr-3">Edit</Link>
//                   <button onClick={() => deleteProduct(p._id)} className="text-red-600 hover:underline">Delete</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {products.length === 0 && <p className="p-8 text-center text-gray-500">No products.</p>}
//       </div>
//     </div>
//   );
// };

// export default Products;

'use client';

import { useState, useEffect } from 'react';
import { apiGetAllAdminProducts } from '@/service/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    apiGetAllAdminProducts(token, 'limit=200')
      .then((r) => {
        setProducts(r.data.products || []);
      })
      .catch((err) => {
        setProducts([]);
        setError(err.response?.data?.message || 'Failed to load products.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchProducts(), []);

  const imgSrc = (p) => {
    const src = p.image;
    return src?.startsWith('http')
      ? src
      : src
        ? '' + src
        : 'https://via.placeholder.com/80';
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
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                All Products
              </h1>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Image
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((p) => (
                      <tr key={p._id}>
                        <td className="px-4 py-3">
                          <img
                            src={imgSrc(p)}
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80';
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{p.productName}</td>
                        <td className="px-4 py-3">
                          {p.vendorId?.fullName || 'Unknown Vendor'}
                        </td>
                        <td className="px-4 py-3">{p.price || '-'}</td>
                        <td className="px-4 py-3">{p.stock ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <p className="p-8 text-center text-gray-500">No products.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
