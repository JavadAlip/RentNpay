'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { clearCart, syncCart } from '@/store/slices/cartSlice';
import { api } from '@/lib/axios';
import { USER_AUTH } from '@/lib/userAuthApi';
import {
  MapPin,
  Search,
  Heart,
  ShoppingCart,
  Truck,
  Menu,
  X,
  LocateFixed,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const Navbar = () => {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const { openAuth } = useAuthModal();

  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const cartCount = useSelector((s) =>
    s.cart.items.reduce((a, i) => a + i.quantity, 0),
  );

  const firstLetter = user?.fullName?.charAt(0)?.toUpperCase() || '';
  const firstName = user?.fullName?.split(' ')[0] || '';

  // Keep cart UI in sync when user logs in/out without a full refresh.
  // (Cart state is stored in localStorage, scoped per user.)
  useEffect(() => {
    dispatch(syncCart());
  }, [dispatch, isAuthenticated, user?.id, user?._id, user?.email]);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Logout handler
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post(USER_AUTH.logout);
    } catch (err) {
      // Even if API fails, clear local state
      console.error('Logout API error:', err);
    } finally {
      dispatch(logoutAction());
      dispatch(clearCart());
      setShowProfileDropdown(false);
      setLoggingOut(false);
      router.push('/');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
      setMenuOpen(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl">
              R
            </div>
          </Link>

          {/* Location */}
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
              href="/cart"
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
              href="/wishlist"
              className="flex items-center gap-1 hover:text-black p-1"
            >
              <Heart size={18} className="w-5 h-5 text-red-500" />
              <span className="hidden md:inline text-sm">Wishlist</span>
            </Link>

            {/* ✅ Profile with dropdown — only when logged in */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileDropdown((prev) => !prev)}
                  className="flex items-center gap-2 hover:text-black p-1"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {firstLetter}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {firstName}
                  </span>
                  <ChevronDown
                    size={14}
                    className="hidden md:block text-gray-400"
                  />
                </button>

                {/* ✅ Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {firstLetter}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={15} />
                      My Profile
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Truck size={15} className="text-orange-500" />
                      My Orders
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <LogOut size={15} />
                      {loggingOut ? 'Logging out…' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Mobile menu button */}
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

        {/* Mobile menu */}
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

            {/* ✅ Mobile — profile + logout */}
            {isAuthenticated && user && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {firstLetter}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                >
                  <User size={15} />
                  My Profile
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                >
                  <Truck size={15} className="text-orange-500" />
                  My Orders
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 disabled:opacity-50"
                >
                  <LogOut size={15} />
                  {loggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Location Modal — unchanged */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4">
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">
                Choose your location
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 text-center">
                Please select a location to view products near you.
              </p>
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
              <button className="mt-5 w-full flex items-center justify-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-medium py-2.5 sm:py-3 shadow-[0_10px_22px_rgba(249,115,22,0.45)]">
                <LocateFixed className="w-4 h-4" />
                Fetch my location
              </button>
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  openAuth('login');
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm text-gray-700 py-2.5 sm:py-3 hover:bg-gray-50"
              >
                <User className="w-4 h-4" />
                Login for saved addresses
              </button>
              <div className="mt-4 text-[10px] sm:text-xs text-gray-500 text-center px-3">
                We deliver within <span className="font-semibold">50km</span>{' '}
                radius from your location.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
