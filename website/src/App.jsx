import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import RentPage from './pages/RentPage';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import RentPrdctDetail from './pages/RentPrdctDetail';
import BuyPage from './pages/BuyPage';
import ServicePage from './pages/ServicePage';
import ServiceDetails from './pages/ServiceDetails';
import PaymentSuccesfulPage from './pages/PaymentSuccesful';
import OrderList from './pages/OrderList';
import PaymentList from './pages/PaymentList';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('rentpay_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rent" element={<RentPage />} />
          <Route path="/rent-product-details" element={<RentPrdctDetail />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/service-details-page" element={<ServiceDetails />} />
          <Route
            path="/payment-successful"
            element={<PaymentSuccesfulPage />}
          />
          <Route path="/order-list" element={<OrderList />} />
          <Route path="/payment-lists" element={<PaymentList />} />

          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
