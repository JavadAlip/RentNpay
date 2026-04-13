'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';

export default function BrevoTestLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ emailAddress: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.post('/brevo-test/login', form);
      if (typeof window !== 'undefined') {
        localStorage.setItem('brevoTestToken', data?.token || '');
        localStorage.setItem('brevoTestUser', JSON.stringify(data?.vendor || {}));
      }
      router.push('/brevo-test/dashboard');
    } catch (error) {
      setErr(error?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Brevo Test Login</h1>
      <p className="mt-1 text-sm text-gray-500">
        Separate dummy login for Brevo OTP testing.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-xl border p-4">
        <input
          type="email"
          placeholder="Email address"
          value={form.emailAddress}
          onChange={(e) =>
            setForm((p) => ({ ...p, emailAddress: e.target.value }))
          }
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
      </form>
      <div className="mt-3 text-sm">
        New user?{' '}
        <button
          type="button"
          onClick={() => router.push('/brevo-test/register')}
          className="text-blue-600 hover:underline"
        >
          Register
        </button>
      </div>
    </main>
  );
}
