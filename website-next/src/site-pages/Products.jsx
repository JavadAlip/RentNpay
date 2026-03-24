'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import { apiGetAllProducts, apiGetPublicActiveOffers } from '../lib/api';

const Products = () => {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [offersByProduct, setOffersByProduct] = useState({});
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: '',
    type: '',
    availability: '',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 6;

  const parsePrice = (raw) => {
    const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const search = searchParams.get('search') || '';
  const categoryUrl = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    Promise.all([apiGetAllProducts('limit=400'), apiGetPublicActiveOffers()])
      .then(([pRes, oRes]) => {
        const list = pRes.data?.products || [];
        const offers = oRes.data?.offers || [];
        const map = {};
        offers.forEach((o) => {
          map[String(o.productId)] = o;
        });
        setAllProducts(list);
        setOffersByProduct(map);
      })
      .catch(() => {
        setAllProducts([]);
        setOffersByProduct({});
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: categoryUrl || prev.category,
    }));
  }, [categoryUrl]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean)));
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = Number(filters.minPrice || 0);
    const max = Number(filters.maxPrice || 0);

    return allProducts.filter((p) => {
      const price = parsePrice(p.price);
      const productText = `${p.productName || ''} ${p.category || ''} ${p.subCategory || ''}`.toLowerCase();
      const matchesSearch = term ? productText.includes(term) : true;
      const matchesCategory = filters.category
        ? String(p.category || '').toLowerCase() ===
          String(filters.category).toLowerCase()
        : true;
      const matchesType = filters.type
        ? String(p.type || '').toLowerCase() === String(filters.type).toLowerCase()
        : true;
      const matchesAvailability =
        filters.availability === 'available'
          ? Number(p.stock || 0) > 0
          : filters.availability === 'unavailable'
            ? Number(p.stock || 0) <= 0
            : true;
      const matchesMin = filters.minPrice ? price >= min : true;
      const matchesMax = filters.maxPrice ? price <= max : true;
      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesAvailability &&
        matchesMin &&
        matchesMax
      );
    });
  }, [allProducts, filters, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const products = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredProducts.slice(start, start + perPage);
  }, [filteredProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Products</h1>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-4 bg-white border border-gray-200 rounded-2xl p-4 h-fit">
          <h3 className="font-semibold text-gray-900">Filters</h3>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Price range</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, minPrice: e.target.value }))
                }
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, maxPrice: e.target.value }))
                }
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((p) => ({ ...p, category: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Type</p>
            <select
              value={filters.type}
              onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All</option>
              <option value="Rental">Rental</option>
              <option value="Sell">Sell</option>
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Availability</p>
            <div className="space-y-2 text-sm">
              {[
                { value: '', label: 'All' },
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Unavailable' },
              ].map((a) => (
                <label key={a.label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.availability === a.value}
                    onChange={() =>
                      setFilters((p) => ({ ...p, availability: a.value }))
                    }
                  />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              setFilters({
                minPrice: '',
                maxPrice: '',
                category: categoryUrl || '',
                type: '',
                availability: '',
              })
            }
            className="w-full py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-500 text-lg font-medium">
                No products found
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your filters or search term
              </p>
            </div>
          ) : (
            <>
              {/* Product count */}
              <p className="text-sm text-gray-500 mb-4">
                Showing{' '}
                <span className="font-medium text-gray-700">
                  {filteredProducts.length}
                </span>{' '}
                product{products.length !== 1 ? 's' : ''}
              </p>

              {/* Product grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    offer={offersByProduct[String(p._id)]}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            page === p
                              ? 'bg-primary text-white'
                              : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
