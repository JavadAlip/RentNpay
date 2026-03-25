import VendorDetails from '@/admin-pages/VendorDetails';

export default function VendorDetailsPage({ params }) {
  return <VendorDetails vendorId={params?.id} />;
}

