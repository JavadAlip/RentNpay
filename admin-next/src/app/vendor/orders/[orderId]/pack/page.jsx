import VendorOrderPackPage from '@/Vendor/Pages/Dashboard/VendorOrderPackPage';

export default function Page({ params }) {
  return <VendorOrderPackPage orderId={params.orderId} />;
}
