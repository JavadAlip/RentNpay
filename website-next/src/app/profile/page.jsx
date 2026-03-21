import ProtectedRoute from "@/components/ProtectedRoute";
import Profile from "@/site-pages/Profile";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}
