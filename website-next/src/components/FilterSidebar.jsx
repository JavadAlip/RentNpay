import { useState, useEffect } from 'react';

const CONDITIONS = ['new', 'like-new', 'good', 'fair'];
const AVAILABILITY = [
  { value: '', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' }
];

const FilterSidebar = ({ filters, onFilterChange, brands = [], categories = [], categoryFromUrl = '' }) => {
  const [priceMin, setPriceMin] = useState(filters.minPrice || '');
  const [priceMax, setPriceMax] = useState(filters.maxPrice || '');
  const [brand, setBrand] = useState(filters.brand || '');
  const [category, setCategory] = useState(filters.category || categoryFromUrl || '');
  const [condition, setCondition] = useState(filters.condition || '');
  const [availability, setAvailability] = useState(filters.availability || '');

  useEffect(() => {
    setCategory(filters.category || categoryFromUrl || '');
  }, [filters.category, categoryFromUrl]);

  const apply = () => {
    onFilterChange({
      minPrice: priceMin || undefined,
      maxPrice: priceMax || undefined,
      brand: brand || undefined,
      category: category || undefined,
      condition: condition || undefined,
      availability: availability || undefined
    });
  };

  const clear = () => {
    setPriceMin('');
    setPriceMax('');
    setBrand('');
    setCategory('');
    setCondition('');
    setAvailability('');
    onFilterChange({});
  };

  return (
    <aside className="w-64 flex-shrink-0 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>
      {categories.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Condition</h3>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">All</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
        <div className="space-y-2">
          {AVAILABILITY.map((a) => (
            <label key={a.value || 'all'} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability"
                value={a.value}
                checked={availability === a.value}
                onChange={() => setAvailability(a.value)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">{a.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={apply} className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 text-sm">
          Apply
        </button>
        <button onClick={clear} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          Clear
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;
