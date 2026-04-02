import KycReview from '@/admin-pages/KycReview';

export default function KycVendorReviewPage({ params }) {
  return <KycReview vendorIdProp={params?.vendorId} />;
}
