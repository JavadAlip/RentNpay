'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { api } from '../lib/axios';
import { addToCart } from '../store/slices/cartSlice';

const ProductDetails = () => {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    api
      .get(`/api/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const add = () => {
    if (!product) return;
    dispatch(
      addToCart({
        productId: product._id,
        quantity,
        pricePerDay: product.pricePerDay,
        title: product.title,
        image: product.images?.[0],
      }),
    );
    router.push('/cart');
  };

  const rentNow = () => {
    if (!product) return;
    dispatch(
      addToCart({
        productId: product._id,
        quantity: 1,
        pricePerDay: product.pricePerDay,
        title: product.title,
        image: product.images?.[0],
      }),
    );
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        Product not found.
      </div>
    );
  }

  const imgs = product.images?.length
    ? product.images
    : ['https://via.placeholder.com/600?text=No+Image'];
  const imgSrc = (src) =>
    src.startsWith('http')
      ? src
      : (process.env.NEXT_PUBLIC_API_URL || '') + src;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
            <img
              src={imgSrc(imgs[imgIndex])}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600?text=No+Image';
              }}
            />
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {imgs.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === imgIndex ? 'border-primary' : 'border-gray-200'}`}
                >
                  <img
                    src={imgSrc(src)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
          <p className="mt-2 text-gray-600">{product.description}</p>
          <dl className="mt-6 space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Brand</dt>
              <dd className="font-medium">{product.brand || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Condition</dt>
              <dd className="font-medium capitalize">{product.condition}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Availability</dt>
              <dd className="font-medium capitalize">{product.availability}</dd>
            </div>
          </dl>
          <p className="mt-6 text-2xl font-bold text-primary">
            ${product.pricePerDay}{' '}
            <span className="text-base font-normal text-gray-600">/ day</span>
          </p>
          <div className="mt-6 flex items-center gap-4">
            <label className="text-sm text-gray-600">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-20 px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={add}
              disabled={product.availability !== 'available'}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
            <button
              onClick={rentNow}
              disabled={product.availability !== 'available'}
              className="px-6 py-3 border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rent Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
