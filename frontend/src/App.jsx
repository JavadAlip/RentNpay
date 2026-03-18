// import { Routes, Route, Navigate } from 'react-router-dom';
// import AdminLogin from './pages/AdminAuth/AdminLogin';
// import Dashboard from './pages/Dashboard';
// import Products from './pages/Products';
// import ProductEdit from './pages/ProductEdit';
// import Categories from './pages/Categories';
// import Orders from './pages/Orders';
// import Users from './pages/Users';
// import Protected from './components/Protected';
// import AdminLayout from './components/AdminLayout';

// function App() {
//   return (
//     <Routes>
//       {/* Public Route */}
//       <Route path="/admin-login" element={<AdminLogin />} />

//       {/* Protected Routes */}
//       <Route
//         path="/"
//         element={
//           <Protected>
//             <AdminLayout /> {/* Sidebar + TopBar wrapper */}
//           </Protected>
//         }
//       >
//         {/* Redirect default to dashboard */}
//         <Route index element={<Navigate to="/dashboard" replace />} />
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="products" element={<Products />} />
//         <Route path="products/new" element={<ProductEdit />} />
//         <Route path="products/:id" element={<ProductEdit />} />
//         <Route path="categories" element={<Categories />} />
//         <Route path="orders" element={<Orders />} />
//         <Route path="users" element={<Users />} />
//       </Route>

//       {/* Redirect unknown paths */}
//       <Route path="*" element={<Navigate to="/admin-login" replace />} />
//     </Routes>
//   );
// }

// export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminAuth/AdminLogin';
import AdminLayout from './components/AdminLayout'; // sidebar + topbar wrapper
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductEdit from './pages/ProductEdit';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Protected from './components/Protected';

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Protected admin area */}
      <Route
        path="/"
        element={
          <Protected>
            <AdminLayout /> {/* Sidebar + Topbar */}
          </Protected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductEdit />} />
        <Route path="products/:id" element={<ProductEdit />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="users" element={<Users />} />
      </Route>

      {/* Redirect unknown paths */}
      <Route path="*" element={<Navigate to="/admin-login" replace />} />
    </Routes>
  );
}

export default App;
