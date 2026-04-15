import ProtectedRoute from '@/components/ProtectedRoute';
import ReturnStatus from '@/site-pages/ReturnStatus';

export default function ReturnStatusPage() {
  return (
    <ProtectedRoute>
      <ReturnStatus />
    </ProtectedRoute>
  );
}
