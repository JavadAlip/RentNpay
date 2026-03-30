'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

const VendorProtected = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useSelector((state) => state.vendor);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!loading && !isAuthenticated) {
      router.replace('/vendor-main');
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Render stable fallback until redux is hydrated (prevents hydration mismatch).
  if (!mounted) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
};

export default VendorProtected;
