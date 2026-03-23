import ProtectedRoute from '@/components/ProtectedRoute';
import Payment from '@/site-pages/Payment';

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <Payment />
    </ProtectedRoute>
  );
}
