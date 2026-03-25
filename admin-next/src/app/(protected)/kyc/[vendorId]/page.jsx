import KycReview from '@/admin-pages/KycReview';

export default function KycReviewPage({ params }) {
  return <KycReview vendorIdProp={params?.vendorId} />;
}

