'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  removeFromCart,
  updateQuantity,
  syncCart,
} from '../store/slices/cartSlice';
import { apiGetProductById } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

const Cart = () => {
  const { items } = useSelector((s) => s.cart);
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const { pushToast } = useToast();

  const stockMapKey = useMemo(
    () => items.map((i) => i.productId).sort().join('_'),
    [items],
  );
  const [stockByProductId, setStockByProductId] = useState({});

  const total = useMemo(() => {
    return items.reduce((sum, i) => {
      const rentalMonths = Number(i.rentalMonths || 1);
      return sum + Number(i.pricePerDay) * rentalMonths * Number(i.quantity);
    }, 0);
  }, [items]);

  const imgSrc = (src) => {
    if (!src) return 'https://via.placeholder.com/100?text=No+Image';
    return src.startsWith('http')
      ? src
      : (process.env.NEXT_PUBLIC_API_URL || '') + src;
  };

  useEffect(() => {
    dispatch(syncCart());
  }, [dispatch, user, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    const ids = Array.from(new Set(items.map((i) => i.productId))).filter(Boolean);
    if (!ids.length) {
      setStockByProductId({});
      return;
    }

    Promise.all(
      ids.map((id) =>
        apiGetProductById(id)
          .then((res) => ({
            id,
            stock:
              res.data?.product?.stock != null ? Number(res.data.product.stock) : 0,
          }))
          .catch(() => ({ id, stock: 0 })),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      const next = {};
      pairs.forEach((p) => {
        next[p.id] = p.stock;
      });
      setStockByProductId(next);
    });

    return () => {
      cancelled = true;
    };
  }, [stockMapKey]);

  const getStockAndCheck = async (productId, nextQty) => {
    const id = productId;
    const res = await apiGetProductById(id);
    const stock = res.data?.product?.stock ?? stockByProductId[id] ?? 0;
    return { ok: Number(nextQty) <= Number(stock || 0), stock: Number(stock || 0) };
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Your cart is empty
        </h1>
        <Link
          href="/products"
          className="text-primary font-medium hover:underline"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl"
            >
              <img
                src={imgSrc(item.image)}
                alt=""
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {item.title}
                </p>
                <p className="text-primary font-semibold">
                  ₹{item.pricePerDay}/mo
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() =>
                      dispatch(
                        updateQuantity({
                          productId: item.productId,
                          quantity: item.quantity - 1,
                        }),
                      )
                    }
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                  onClick={async () => {
                    const productId = item.productId;
                    const nextQty = item.quantity + 1;
                    const { ok, stock } = await getStockAndCheck(
                      productId,
                      nextQty,
                    );
                    if (!ok) {
                      pushToast(
                        `Only ${stock} available in stock for this product.`,
                        'error',
                      );
                      return;
                    }
                    dispatch(
                      updateQuantity({
                        productId,
                        quantity: nextQty,
                      }),
                    );
                  }}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              <p className="text-xs text-gray-500 mt-1">
                Rental duration: {item.rentalMonths || 1} months
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Available stock: {stockByProductId[item.productId] ?? '—'}
              </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  ₹
                  {(
                    Number(item.pricePerDay) *
                    Number(item.rentalMonths || 1) *
                    Number(item.quantity)
                  ).toFixed(2)}
                </p>
                <button
                  onClick={() => dispatch(removeFromCart(item.productId))}
                  className="mt-2 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Summary</h2>
            <p className="text-gray-600">
              Total rental cost:{' '}
              <span className="font-bold text-primary">
                ₹{total.toFixed(2)}
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Final amount depends on rental duration at checkout.
            </p>
            <Link
              href="/checkout"
              className="mt-6 block w-full py-3 bg-primary text-white text-center font-medium rounded-lg hover:bg-primary-700"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 block text-center text-primary text-sm hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
