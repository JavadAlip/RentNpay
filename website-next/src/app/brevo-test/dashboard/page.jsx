'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';

export default function BrevoTestDashboardPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('brevoTestToken') : '';
    if (!token) {
      router.replace('/brevo-test/login');
      return;
    }
    api
      .get('/brevo-test/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!active) return;
        setVendor(res.data?.vendor || null);
      })
      .catch((error) => {
        if (!active) return;
        setErr(error?.response?.data?.message || 'Session invalid.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const onLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brevoTestToken');
      localStorage.removeItem('brevoTestUser');
    }
    router.replace('/brevo-test/login');
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <p className="text-sm text-gray-600">Loading dashboard...</p>
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <p className="text-sm text-red-600">{err}</p>
        <button
          type="button"
          onClick={() => router.replace('/brevo-test/login')}
          className="mt-3 rounded-lg border px-3 py-2 text-sm"
        >
          Go to login
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Brevo Test Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Dummy page: confirms OTP + login flow is working.
      </p>
      <div className="mt-6 rounded-xl border p-4 text-sm">
        <p>
          <span className="font-semibold">Name:</span> {vendor?.fullName || '—'}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Email:</span>{' '}
          {vendor?.emailAddress || '—'}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Verified:</span>{' '}
          {vendor?.isVerified ? 'Yes' : 'No'}
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Logout
      </button>
    </main>
  );
}
