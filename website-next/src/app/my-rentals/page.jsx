import ProtectedRoute from '@/components/ProtectedRoute';
import RentalCommandCenter from '@/site-pages/RentalCommandCenter';

export default function MyRentalsPage() {
  return (
    <ProtectedRoute>
      <RentalCommandCenter />
    </ProtectedRoute>
  );
}
