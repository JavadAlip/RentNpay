import { Suspense } from 'react';
import PaymentSuccesful from '@/site-pages/PaymentSuccesful';

export default function PaymentSuccessfulPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccesful />
    </Suspense>
  );
}
