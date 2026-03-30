import ProtectedRoute from '@/components/ProtectedRoute';
import Wishlist from '@/site-pages/Wishlist';

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <Wishlist />
    </ProtectedRoute>
  );
}
