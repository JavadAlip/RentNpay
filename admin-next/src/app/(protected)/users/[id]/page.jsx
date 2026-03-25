import UserDetails from '@/admin-pages/UserDetails';

export default function UserDetailsPage({ params }) {
  return <UserDetails userId={params?.id} />;
}
