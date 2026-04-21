import VendorCustomerDetailsPage from '@/Vendor/Pages/Dashboard/CustomerDetails';

export default function Page({ params }) {
  return <VendorCustomerDetailsPage userId={params?.userId} />;
}
