'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { api } from '@/lib/axios';
import { USER_AUTH, normalizeUserFromApi } from '@/lib/userAuthApi';
import { setCredentials } from '@/store/slices/authSlice';

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailAddress.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(USER_AUTH.login, { emailAddress, password });
      const { token, user } = res.data || {};
      if (token && user) {
        const normalized = normalizeUserFromApi(user);
        dispatch(setCredentials({ token, user: normalized }));
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('rn_login_welcome', '1');
        }
        router.push('/');
      } else {
        setError('Unexpected login response.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Login to continue renting with RentNPay.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

