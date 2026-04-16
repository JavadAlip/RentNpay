import VendorTicketDetailsPage from '@/Vendor/Pages/Dashboard/TicketDetails';

export default function Page({ params }) {
  return (
    <VendorTicketDetailsPage orderId={params.orderId} issueId={params.issueId} />
  );
}
