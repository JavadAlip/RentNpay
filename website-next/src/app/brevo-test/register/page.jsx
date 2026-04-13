'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';

export default function BrevoTestRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    emailAddress: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post('/brevo-test/register', form);
      setMsg(data?.message || 'OTP sent.');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('brevoTestEmail', form.emailAddress.trim());
      }
      router.push(
        `/brevo-test/verify-otp?email=${encodeURIComponent(form.emailAddress)}`,
      );
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Brevo Test Register</h1>
      <p className="mt-1 text-sm text-gray-500">
        Separate dummy flow for testing Brevo OTP delivery.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-xl border p-4">
        <input
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
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
          {loading ? 'Submitting...' : 'Register & Send OTP'}
        </button>
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
      </form>
      <div className="mt-3 text-sm">
        Already verified?{' '}
        <button
          type="button"
          onClick={() => router.push('/brevo-test/login')}
          className="text-blue-600 hover:underline"
        >
          Login here
        </button>
      </div>
    </main>
  );
}
