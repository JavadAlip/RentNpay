'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import OrderTrackPage from '@/site-pages/OrderTrackPage';

export default function OrderTrackRoutePage() {
  return (
    <ProtectedRoute>
      <OrderTrackPage />
    </ProtectedRoute>
  );
}
