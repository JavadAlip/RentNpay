import VendorDetails from '@/admin-pages/VendorDetails';

export default async function VendorDetailsPage({ params }) {
  const resolved = await Promise.resolve(params);
  const id = resolved?.id;
  return <VendorDetails vendorId={id} />;
}

