import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/axios';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', 12);
    const search = searchParams.get('search');
    const categoryUrl = searchParams.get('category');
    if (search) params.set('search', search);
    if (categoryUrl) params.set('category', categoryUrl);
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });

    api.get(`/api/products?${params}`)
      .then((res) => {
        setProducts(res.data.products || []);
        setTotalPages(res.data.pages || 1);
        const b = [...new Set((res.data.products || []).map((p) => p.brand).filter(Boolean))];
        setBrands(b);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [page, filters, searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Products</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar filters={filters} onFilterChange={(f) => { setFilters(f); setPage(1); }} brands={brands} categories={categories} categoryFromUrl={searchParams.get('category') || ''} />
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : products.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">No products found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
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
