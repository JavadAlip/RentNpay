import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/axios';
import { Heart, Loader2 } from 'lucide-react';

const Wishlist = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/users/wishlist');
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      const mapped = items.map((x) => x?.productId).filter(Boolean);
      setProducts(mapped);
    } catch (err) {
      setProducts([]);
      setError(err?.response?.data?.message || 'Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wishedSet = useMemo(() => {
    return new Set(products.map((p) => String(p._id || '')));
  }, [products]);

  const toggleWishlist = async (productId) => {
    try {
      await api.post('/api/users/wishlist/toggle', { productId });
      await fetchWishlist();
    } catch (err) {
      // keep UI unchanged
      setError(err?.response?.data?.message || 'Wishlist update failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your wishlisted products will appear here.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading wishlist…
          </div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm mb-4">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 rounded-2xl border border-gray-200 bg-white text-center text-gray-500">
          No wishlist items yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const pid = String(p._id);
            const isWished = wishedSet.has(pid);
            const img = p.image || (Array.isArray(p.images) ? p.images[0] : '');
            return (
              <div
                key={pid}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-sm transition"
              >
                <div className="relative">
                  <img
                    src={img || 'https://placehold.co/600x400/e5e7eb/6b7280?text=IMG'}
                    alt={p.productName || 'Product'}
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => toggleWishlist(pid)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 border border-gray-200 flex items-center justify-center"
                    aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      size={18}
                      className={isWished ? 'text-red-500 fill-red-500' : 'text-gray-500'}
                    />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <p className="font-semibold text-gray-900 line-clamp-2">
                    {p.productName || 'Product'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.category || '—'} {p.subCategory ? `· ${p.subCategory}` : ''}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {p.price || ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    Stock: {Number(p.stock || 0)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

