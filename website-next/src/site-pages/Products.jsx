'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import { Filter, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import {
  apiGetStorefrontVendorProducts,
  apiGetPublicActiveOffers,
  apiGetCategories,
} from '../lib/api';

const Products = () => {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [categoriesMaster, setCategoriesMaster] = useState([]);
  const [offersByProduct, setOffersByProduct] = useState({});
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: '',
    subCategory: '',
    brand: '',
    type: '',
    availability: '',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const perPage = 6;

  const parsePrice = (raw) => {
    const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const search = searchParams.get('search') || '';
  const categoryUrl = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGetStorefrontVendorProducts('limit=400'),
      apiGetPublicActiveOffers(),
    ])
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
    apiGetCategories()
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.categories || [];
        setCategoriesMaster(list);
      })
      .catch(() => setCategoriesMaster([]));
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

  const subCategoryOptions = useMemo(() => {
    const rows = allProducts
      .filter((p) => {
        if (!filters.category) return true;
        return (
          String(p.category || '').toLowerCase() ===
          String(filters.category).toLowerCase()
        );
      })
      .map((p) => p.subCategory)
      .filter(Boolean);
    return Array.from(new Set(rows));
  }, [allProducts, filters.category]);

  const brands = useMemo(() => {
    const rows = allProducts
      .filter((p) => {
        if (!filters.category) return true;
        return (
          String(p.category || '').toLowerCase() ===
          String(filters.category).toLowerCase()
        );
      })
      .map((p) => p.brand)
      .filter(Boolean);
    return Array.from(new Set(rows)).slice(0, 6);
  }, [allProducts, filters.category]);

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
      const matchesSubCategory = filters.subCategory
        ? String(p.subCategory || '').toLowerCase() ===
          String(filters.subCategory).toLowerCase()
        : true;
      const matchesBrand = filters.brand
        ? String(p.brand || '').toLowerCase() ===
          String(filters.brand).toLowerCase()
        : true;
      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubCategory &&
        matchesBrand &&
        matchesType &&
        matchesAvailability &&
        matchesMin &&
        matchesMax
      );
    });
  }, [allProducts, filters, search]);

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    if (sortBy === 'price-low-high') {
      arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'price-high-low') {
      arr.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sortBy === 'newest') {
      arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return arr;
  }, [filteredProducts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / perPage));
  const products = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedProducts.slice(start, start + perPage);
  }, [sortedProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [filters, search, sortBy]);

  const topTabs = useMemo(() => {
    const set = new Set(
      allProducts
        .map((p) => String(p?.subCategory || '').trim())
        .filter(Boolean),
    );
    return Array.from(set);
  }, [allProducts]);

  const iconCategories = useMemo(() => {
    const fromMaster = (categoriesMaster || []).map((c) => ({
      name: String(c?.name || '').trim(),
      image: c?.image || '',
    }));
    const fromProducts = categoryOptions
      .filter((name) => !fromMaster.some((m) => m.name.toLowerCase() === name.toLowerCase()))
      .map((name) => ({ name, image: '' }));
    return [...fromMaster, ...fromProducts].filter((x) => x.name);
  }, [categoriesMaster, categoryOptions]);

  const breadcrumbCategory =
    filters.category ||
    categoryUrl ||
    String(allProducts?.[0]?.category || '').trim() ||
    'Category';
  const breadcrumbSubCategory =
    filters.subCategory ||
    String(
      allProducts.find(
        (p) =>
          String(p?.category || '').toLowerCase() ===
          String(breadcrumbCategory || '').toLowerCase(),
      )?.subCategory || '',
    ).trim();

  const FilterSidebar = () => (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-5 bg-white border border-gray-200 rounded-2xl p-4 h-fit">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() =>
            setFilters({
              minPrice: '',
              maxPrice: '',
              category: categoryUrl || '',
              subCategory: '',
              brand: '',
              type: '',
              availability: '',
            })
          }
          className="text-xs text-orange-500 hover:underline"
        >
          Clear All
        </button>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Price Range</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="₹100"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters((p) => ({ ...p, minPrice: e.target.value }))
            }
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="₹5000"
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
            setFilters((p) => ({ ...p, category: e.target.value, subCategory: '' }))
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
        <p className="text-sm font-medium text-gray-700 mb-2">Sub Category</p>
        <select
          value={filters.subCategory || ''}
          onChange={(e) =>
            setFilters((p) => ({ ...p, subCategory: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">All</option>
          {subCategoryOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Brand</p>
        <div className="space-y-1.5 text-sm">
          {brands.length ? (
            brands.map((b) => (
              <label key={b} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="brand"
                  checked={filters.brand === b}
                  onChange={() => setFilters((p) => ({ ...p, brand: b }))}
                />
                <span>{b}</span>
              </label>
            ))
          ) : (
            <p className="text-xs text-gray-500">No brands</p>
          )}
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="brand"
              checked={!filters.brand}
              onChange={() => setFilters((p) => ({ ...p, brand: '' }))}
            />
            <span>All</span>
          </label>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Condition</p>
        <div className="space-y-1.5 text-sm">
          {['Brand New', 'Like New', 'Good', 'Fair'].map((c) => (
            <label key={c} className="flex items-center gap-2">
              <input type="checkbox" disabled />
              <span className="text-gray-400">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Availability</p>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.availability === 'available'}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                availability: e.target.checked ? 'available' : '',
              }))
            }
          />
          Exclude Out of Stock
        </label>
      </div>
    </aside>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-xs text-gray-500 mb-3">
        Home {'›'} {breadcrumbCategory}
        {breadcrumbSubCategory ? ` › ${breadcrumbSubCategory}` : ''}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {topTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilters((p) => ({ ...p, subCategory: tab }))}
            className={`px-4 py-1.5 rounded-lg text-xs border ${
              String(filters.subCategory || '').toLowerCase() === tab.toLowerCase()
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-5">
        {iconCategories.map((c) => (
          <button
            key={c.name}
            onClick={() =>
              setFilters((p) => ({ ...p, category: c.name, subCategory: '' }))
            }
            className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border min-w-[70px] ${
              String(filters.category || '').toLowerCase() ===
              c.name.toLowerCase()
                ? 'border-orange-300 bg-orange-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden">
              {c.image ? (
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <span className="text-[11px] text-gray-700">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="hidden lg:block">
          <FilterSidebar />
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileFiltersOpen((v) => !v)}
                className="lg:hidden inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pr-8 pl-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  <option value="relevance">Sort by: Relevance</option>
                  <option value="newest">Newest first</option>
                  <option value="price-low-high">Price: Low to high</option>
                  <option value="price-high-low">Price: High to low</option>
                </select>
                <SlidersHorizontal className="w-4 h-4 text-gray-400 absolute right-2 top-2.5" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-gray-500">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'hover:bg-gray-100'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {mobileFiltersOpen ? (
            <div className="lg:hidden mb-4">
              <FilterSidebar />
            </div>
          ) : null}

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
                  {sortedProducts.length}
                </span>{' '}
                product{sortedProducts.length !== 1 ? 's' : ''}
              </p>

              {/* Product grid */}
              <div
                className={
                  viewMode === 'list'
                    ? 'grid grid-cols-1 gap-4'
                    : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                }
              >
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
