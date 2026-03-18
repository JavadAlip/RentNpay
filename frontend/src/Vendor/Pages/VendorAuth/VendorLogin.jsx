import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { vendorLogin, clearError } from '../../../redux/slices/vendorSlice';

const VendorLogin = ({ onClose, onSignup }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.vendor,
  );

  const [form, setForm] = useState({ emailAddress: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Clear stale errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, []);

  // Show toast when Redux sets an error
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: 'top-right',
        autoClose: 3500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    }
  }, [error]);

  // Redirect to dashboard on successful login
  useEffect(() => {
    if (isAuthenticated) {
      toast.success('Welcome back!', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      setTimeout(() => navigate('/vendor-dashboard'), 2000);
    }
  }, [isAuthenticated]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.emailAddress || !form.password) {
      toast.error('Please fill in all fields', {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
      return;
    }
    dispatch(vendorLogin(form));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.10)] border border-gray-100 px-7 py-9 flex flex-col items-center relative">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect
              x="3"
              y="5"
              width="16"
              height="11"
              rx="2.5"
              stroke="white"
              strokeWidth="1.6"
              fill="none"
            />
            <path
              d="M7 5V4a4 4 0 0 1 8 0v1"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="8.5" cy="10.5" r="1" fill="white" />
            <circle cx="13.5" cy="10.5" r="1" fill="white" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-gray-900 tracking-tight">
          Rentnpay
        </span>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 text-center">
        Vendor Sign In
      </h1>
      <p className="text-xs sm:text-sm text-gray-500 mb-5 text-center">
        Welcome back! Sign in to your partner account
      </p>

      {/* Step dots */}
      <div className="flex items-center gap-2 mb-7">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
      </div>

      {/* Form */}
      <div className="w-full flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
            <svg
              className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <input
              type="email"
              name="emailAddress"
              value={form.emailAddress}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter your email address"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
            <svg
              className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter your password"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition ml-2"
            >
              {showPassword ? (
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]
            ${loading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Sign Up link */}
        <div className="flex justify-center">
          <button
            onClick={() =>
              onSignup ? onSignup() : (window.location.href = '/vendor-signup')
            }
            className="text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            Don't have an account?{' '}
            <span className="text-blue-600 font-medium">Please Sign Up</span>
          </button>
        </div>
      </div>

      {/* Secure badge */}
      <div className="flex items-center gap-1.5 mt-7 text-[11px] text-gray-400">
        <svg
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
        Secure &amp; Private
      </div>
    </div>
  );
};

export default VendorLogin;
