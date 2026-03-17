import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin, clearError } from '../../redux/adminSlice';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.admin);
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      dispatch(clearError());
    }, 5000);

    return () => clearTimeout(timer);
  }, [error, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.identifier || !formData.password) {
      alert('Please enter both identifier and password');
      return;
    }

    try {
      const result = await dispatch(adminLogin(formData)).unwrap();
      console.log('Admin login successful:', result);

      // Redirect to admin dashboard after successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Admin login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
          {/* Left Side - Image/Placeholder */}
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center p-8">
            <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <User className="w-24 h-24 text-white mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Admin Portal</h2>
                <p className="mt-2 opacity-90">
                  Sign in to manage the platform
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-md">
              {/* Heading */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
                Admin Sign In
              </h1>

              {/* Subheading */}
              {/* <p className="text-gray-600 text-center mb-8">
                Access your admin dashboard
              </p> */}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                {/* Identifier Input (Email or Username) */}
                <div className="mb-4">
                  <label
                    htmlFor="identifier"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      placeholder="Enter your email or username"
                      value={formData.identifier}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 disabled:bg-gray-100"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                {/* Password Input */}
                <div className="mb-6">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password *
                  </label>

                  <div className="relative">
                    {/* Lock Icon */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-5 h-5 text-gray-600" />
                    </div>

                    {/* Input */}
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 disabled:bg-gray-100"
                      required
                    />

                    {/* Eye Icon */}
                    <div
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white font-semibold py-3.5 rounded-lg hover:bg-orange-700 transition-colors mb-6 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
              {/* <p
                className="text-blue-600 text-sm cursor-pointer text-right"
                onClick={() => navigate('/admin-forgot-password')}
              >
                Forgot Password?
              </p> */}

              {/* Admin Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm text-center">
                  <strong>Note:</strong> This portal is for authorized
                  administrators only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
