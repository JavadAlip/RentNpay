'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BuyPrdctDetail from '@/site-pages/BuyPrdctDetail';
import { apiGetProductById } from '@/lib/api';

export default function BuyProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiGetProductById(id)
      .then((res) => {
        setProduct(res.data?.product || null);
      })
      .catch(() => setProduct(null))
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

  return <BuyPrdctDetail product={product} />;
}

