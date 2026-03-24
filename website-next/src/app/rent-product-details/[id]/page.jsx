// import RentPrdctDetail from "@/site-pages/RentPrdctDetail";

// export default function RentProductDetailsPage() {
//   return <RentPrdctDetail />;
// }

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RentPrdctDetail from '@/site-pages/RentPrdctDetail';
import { apiGetProductById, apiGetPublicActiveOffers } from '@/lib/api';

export default function RentProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([apiGetProductById(id), apiGetPublicActiveOffers()])
      .then(([pRes, oRes]) => {
        const p = pRes.data?.product || null;
        setProduct(p);
        if (!p?._id) {
          setOffer(null);
          return;
        }
        const matched = (oRes.data?.offers || []).find(
          (o) => String(o.productId) === String(p._id),
        );
        setOffer(matched || null);
      })
      .catch(() => {
        setProduct(null);
        setOffer(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-gray-500 text-lg font-medium">Product not found</p>
      </div>
    );
  }

  return <RentPrdctDetail product={product} offer={offer} />;
}
