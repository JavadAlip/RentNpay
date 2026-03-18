// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useSelector, useDispatch } from 'react-redux';
// import { logout } from '../store/slices/authSlice';

// const Navbar = () => {
//   const [search, setSearch] = useState('');
//   const [menuOpen, setMenuOpen] = useState(false);
//   const { user, isAuthenticated } = useSelector((s) => s.auth);
//   const cartCount = useSelector((s) => s.cart.items.reduce((a, i) => a + i.quantity, 0));
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
//   };

//   return (
//     <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-between h-16">
//           <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
//             Rentpay
//           </Link>

//           <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
//             <input
//               type="text"
//               placeholder="Search products, rentals, services..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
//             />
//             <button type="submit" className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-700">
//               Search
//             </button>
//           </form>

//           <nav className="hidden md:flex items-center gap-4">
//             <Link to="/products" className="text-gray-600 hover:text-primary">Products</Link>
//             <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary">
//               Cart
//               {cartCount > 0 && (
//                 <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
//                   {cartCount}
//                 </span>
//               )}
//             </Link>
//             {isAuthenticated ? (
//               <div className="relative group">
//                 <button className="flex items-center gap-1 text-gray-600 hover:text-primary">
//                   {user?.name}
//                 </button>
//                 <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
//                   <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">Profile</Link>
//                   {user?.role === 'admin' && (
//                     <a href={import.meta.env.VITE_ADMIN_URL || '/admin'} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-gray-100">Admin</a>
//                   )}
//                   <button onClick={() => dispatch(logout())} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600">
//                     Logout
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <Link to="/login" className="text-gray-600 hover:text-primary">Login</Link>
//             )}
//           </nav>

//           <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
//           </button>
//         </div>

//         {menuOpen && (
//           <div className="md:hidden py-4 border-t">
//             <form onSubmit={handleSearch} className="mb-4">
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//               />
//               <button type="submit" className="mt-2 w-full py-2 bg-primary text-white rounded">Search</button>
//             </form>
//             <Link to="/products" className="block py-2" onClick={() => setMenuOpen(false)}>Products</Link>
//             <Link to="/cart" className="block py-2" onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>
//             {isAuthenticated ? (
//               <>
//                 <Link to="/profile" className="block py-2" onClick={() => setMenuOpen(false)}>Profile</Link>
//                 <button onClick={() => { dispatch(logout()); setMenuOpen(false); }} className="block py-2 text-red-600">Logout</button>
//               </>
//             ) : (
//               <Link to="/login" className="block py-2" onClick={() => setMenuOpen(false)}>Login</Link>
//             )}
//           </div>
//         )}
//       </div>
//     </header>
//   );
// };

// export default Navbar;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin,
  Search,
  Heart,
  ShoppingCart,
  Menu,
  X,
  LocateFixed,
  User,
} from 'lucide-react';

const Navbar = () => {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navigate = useNavigate();
  const cartCount = useSelector((s) =>
    s.cart.items.reduce((a, i) => a + i.quantity, 0),
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setMenuOpen(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl">
              R
            </div>
          </Link>

          {/* Location – click opens modal */}
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-600 shrink-0 hover:bg-gray-200 transition-colors"
          >
            <MapPin size={14} className="text-orange-500" />
            <span>Delivering to: Pune, 411057</span>
          </button>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 min-w-0 max-w-xl relative"
          >
            <Search
              size={16}
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search products, rentals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-3 sm:gap-6 text-gray-600 shrink-0">
            <Link
              to="/cart"
              className="relative flex items-center gap-1 hover:text-black p-1"
            >
              <ShoppingCart size={18} className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-1 sm:-top-2 sm:-right-3 bg-red-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/wishlist"
              className="flex items-center gap-1 hover:text-black p-1"
            >
              <Heart size={18} className="w-5 h-5 text-red-500" />
              <span className="hidden md:inline text-sm">Wishlist</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-1 hover:text-black p-1"
            >
              <User size={18} className="w-5 h-5 " />
              <span className="hidden md:inline text-sm">Profile</span>
            </Link>

            {/* Mobile menu button (optional) */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile extra content (optional search / location) */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-3 py-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full text-sm text-gray-600 w-full justify-center"
            >
              <MapPin size={14} className="text-orange-500" />
              <span>Choose your location</span>
            </button>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-0 pl-3 pr-3 py-2 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shrink-0"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4">
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Close button row */}
            <div className="flex justify-end p-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                aria-label="Close location modal"
              >
                ×
              </button>
            </div>

            {/* Modal content */}
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">
                Choose your location
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 text-center">
                Please select a location to view products near you.
              </p>

              {/* Search location field */}
              <div className="mt-5">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Search Location
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Enter area, street name..."
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Primary button */}
              <button className="mt-5 w-full flex items-center justify-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-medium py-2.5 sm:py-3 shadow-[0_10px_22px_rgba(249,115,22,0.45)]">
                <LocateFixed className="w-4 h-4" />
                Fetch my location
              </button>

              {/* Secondary button */}
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setShowLoginModal(true);
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm text-gray-700 py-2.5 sm:py-3 hover:bg-gray-50"
              >
                <User className="w-4 h-4" />
                Login for saved addresses
              </button>

              {/* Info line */}
              <div className="mt-4 text-[10px] sm:text-xs text-gray-500 text-center px-3">
                We deliver within <span className="font-semibold">50km</span>{' '}
                radius from your location.
              </div>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl flex">
            {/* Left Image */}
            <div className="hidden md:block w-1/2">
              <img
                src="https://images.unsplash.com/photo-1616627987949-9c0f1c4a0e90"
                alt="furniture"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Right Content */}
            <div className="w-full md:w-1/2 p-6 relative">
              {/* Close */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold text-gray-900">
                Login or Sign up to Rentnpay
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Enter your phone number to continue
              </p>

              {/* Phone input */}
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <div className="flex items-center border rounded-lg mt-2 overflow-hidden">
                  <span className="px-3 bg-gray-100 text-sm">+91</span>

                  <input
                    type="text"
                    placeholder="Enter your phone number"
                    className="flex-1 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 mt-4">
                I agree to the{' '}
                <span className="text-orange-500">Terms & Conditions</span> and{' '}
                <span className="text-orange-500">Privacy Policies</span>
              </p>

              {/* OTP button */}
              <button className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                Get OTP →
              </button>

              <p className="text-xs text-gray-400 mt-4">
                By continuing, you agree to receive promotional messages
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
