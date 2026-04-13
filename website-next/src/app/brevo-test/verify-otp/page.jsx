'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/axios';

export default function BrevoTestVerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailAddress, setEmailAddress] = useState(
    searchParams.get('email') || '',
  );
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (emailAddress) return;
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('brevoTestEmail') || '';
    if (stored) setEmailAddress(stored);
  }, [emailAddress]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post('/brevo-test/verify-otp', {
        emailAddress,
        otp,
      });
      setMsg(data?.message || 'OTP verified.');
      router.push('/brevo-test/login');
    } catch (error) {
      setErr(error?.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Brevo Test OTP Verify</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter the OTP received in email.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-xl border p-4">
        <input
          type="email"
          placeholder="Email address"
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
        <input
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
      </form>
    </main>
  );
}
