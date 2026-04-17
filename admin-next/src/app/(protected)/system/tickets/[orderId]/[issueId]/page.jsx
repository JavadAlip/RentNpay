import AdminTicketDetails from '@/admin-pages/TicketDetails';

export default function AdminSystemTicketDetailsPage({ params }) {
  const { orderId, issueId } = params;
  return <AdminTicketDetails orderId={orderId} issueId={issueId} />;
}

