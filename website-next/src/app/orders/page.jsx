import ProtectedRoute from '@/components/ProtectedRoute';
import MyOrders from '@/site-pages/MyOrders';

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <MyOrders />
    </ProtectedRoute>
  );
}

