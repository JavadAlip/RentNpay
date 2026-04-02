import KycCustomerReview from '@/admin-pages/KycCustomerReview';

export default function KycCustomerReviewPage({ params }) {
  return <KycCustomerReview userId={params?.userId} />;
}

