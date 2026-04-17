import ProtectedRoute from '@/components/ProtectedRoute';
import MyAddress from '@/site-pages/MyAddress';

export default function MyAddressPage() {
  return (
    <ProtectedRoute>
      <MyAddress />
    </ProtectedRoute>
  );
}
