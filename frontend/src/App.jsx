// import { Routes, Route, Navigate } from 'react-router-dom';
// import AdminLogin from './pages/AdminAuth/AdminLogin';
// import AdminLayout from './components/AdminLayout'; // sidebar + topbar wrapper
// import Dashboard from './pages/Dashboard';
// import Products from './pages/Products';
// import ProductEdit from './pages/ProductEdit';
// import Categories from './pages/Categories';
// import Orders from './pages/Orders';
// import Users from './pages/Users';
// import Protected from './components/Protected';
// import VendorMain from './pages/Vendor/VendorAuth/VendorMain';

// function App() {
//   return (
//     <Routes>
//       {/* Public */}
//       <Route path="/admin-login" element={<AdminLogin />} />

//       {/* Protected admin area */}
//       <Route
//         path="/"
//         element={
//           <Protected>
//             <AdminLayout /> {/* Sidebar + Topbar */}
//           </Protected>
//         }
//       >
//         <Route index element={<Navigate to="/dashboard" replace />} />
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="products" element={<Products />} />
//         <Route path="products/new" element={<ProductEdit />} />
//         <Route path="products/:id" element={<ProductEdit />} />
//         <Route path="categories" element={<Categories />} />
//         <Route path="orders" element={<Orders />} />
//         <Route path="users" element={<Users />} />

//         {/* //vendor */}
//         <Route path="/vendor-main" element={<VendorMain />} />
//       </Route>

//       {/* Redirect unknown paths */}
//       <Route path="*" element={<Navigate to="/admin-login" replace />} />
//     </Routes>
//   );
// }

// export default App;

import { Routes, Route, Navigate } from 'react-router-dom';

// ---------------- ADMIN ----------------
import AdminLogin from './Admin/Pages/AdminAuth/AdminLogin';
import AdminLayout from './Admin/Components/AdminLayout';
import Dashboard from './Admin/Pages/Dashboard/Dashboard';
import Products from './pages/Products';
import ProductEdit from './pages/ProductEdit';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Protected from './Admin/Components/Protected';
import NotFound from './Common/Notfound';

// ---------------- VENDOR ----------------
import VendorMain from './Vendor/Pages/VendorAuth/VendorMain';
import VendorLogin from './Vendor/Pages/VendorAuth/VendorLogin';
import VendorSignup from './Vendor/Pages/VendorAuth/VendorSignup';
import VendorWelcome from './Vendor/Pages/VendorAuth/VendorWelcome';
import VendorOtpVerification from './Vendor/Pages/VendorAuth/VendorOtpVerification';
import VendorDashboard from './Vendor/Pages/Dashboard/VendorDashboard';

function App() {
  return (
    <Routes>
      {/* ================= ADMIN ================= */}

      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/not-found" element={<NotFound />} />

      <Route
        path="/"
        element={
          <Protected>
            <AdminLayout />
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

      {/* ================= VENDOR ================= */}

      {/* 🔥 Direct access (no protection) */}
      <Route path="/vendor-main" element={<VendorMain />} />
      <Route path="/vendor-login" element={<VendorLogin />} />
      <Route path="/vendor-signup" element={<VendorSignup />} />
      <Route path="/vendor-welcome" element={<VendorWelcome />} />
      <Route path="/vendor-otp" element={<VendorOtpVerification />} />
      <Route path="/vendor-dashboard" element={<VendorDashboard />} />

      {/* ================= FALLBACK ================= */}

      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

export default App;
