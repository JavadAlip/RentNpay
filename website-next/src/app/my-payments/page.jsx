import ProtectedRoute from '@/components/ProtectedRoute';
import MyPayments from '@/site-pages/MyPayments';

export default function MyPaymentsPage() {
  return (
    <ProtectedRoute>
      <MyPayments />
    </ProtectedRoute>
  );
}
