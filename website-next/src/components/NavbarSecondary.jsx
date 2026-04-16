'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown, History, X } from 'lucide-react';
import { apiGetStorefrontVendorProducts } from '@/lib/api';

const DELIVERY_STORAGE_KEY = 'rn_delivery_location';

const SEARCH_DEBOUNCE_MS = 220;
const SEARCH_MIN_CHARS = 1;
const SEARCH_SUGGEST_LIMIT = 10;
const SEARCH_RECENT_KEY = 'rn_product_search_recent';
const SEARCH_RECENT_MAX = 8;

function readSearchRecent() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEARCH_RECENT_KEY);
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => typeof x === 'string' && x.trim())
      .slice(0, SEARCH_RECENT_MAX);
  } catch {
    return [];
  }
}

function writeSearchRecent(term) {
  if (typeof window === 'undefined') return;
  const t = String(term || '').trim();
  if (!t) return;
  const prev = readSearchRecent();
  const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(
    0,
    SEARCH_RECENT_MAX,
  );
  localStorage.setItem(SEARCH_RECENT_KEY, JSON.stringify(next));
}

function clearSearchRecentStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SEARCH_RECENT_KEY);
  } catch {
    /* ignore */
  }
}

const NavbarSecondary = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const wrapRef = useRef(null);
  const [deliveryLabel, setDeliveryLabel] = useState('Sadashiv Peth, Pune');

  const formatLocationLabel = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return 'Choose your location';

    // Keep it UI-friendly: show only the first 2 meaningful comma-separated parts
    // (e.g., "Church Street, Wadi Bunder" or "Kochi, Ernakulam").
    const parts = s
      .split(',')
      .map((x) => String(x).trim())
      .filter(Boolean)
      .filter((x) => !/^\s*india\s*$/i.test(x));

    const first = parts[0] || s;
    const second = parts[1] || '';
    const combined = second ? `${first}, ${second}` : first;

    // Final guardrail against very long strings.
    if (combined.length <= 32) return combined;
    return `${combined.slice(0, 32)}...`;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const readAndSet = () => {
      try {
        const raw = localStorage.getItem(DELIVERY_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const label = String(parsed?.label || '').trim();
        if (label) setDeliveryLabel(formatLocationLabel(label));
      } catch {
        /* ignore invalid local storage */
      }
    };

    const onCustomChange = (e) => {
      const label = String(e?.detail?.label || '').trim();
      if (label) setDeliveryLabel(formatLocationLabel(label));
    };

    const onStorage = (e) => {
      if (e.key !== DELIVERY_STORAGE_KEY) return;
      readAndSet();
    };

    readAndSet();
    window.addEventListener('rn_delivery_location_changed', onCustomChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(
        'rn_delivery_location_changed',
        onCustomChange,
      );
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const q = search.trim();
  const matchingRecent = useMemo(() => {
    if (!q.length) return [];
    const lower = q.toLowerCase();
    return readSearchRecent().filter((r) => r.toLowerCase().includes(lower));
  }, [q]);

  const showRecentsOnly = open && q.length === 0 && recentSearches.length > 0;
  const showSuggestionsPanel =
    open && q.length >= SEARCH_MIN_CHARS && (suggestions.length > 0 || loading);

  useEffect(() => {
    if (!open) return;
    if (q.length !== 0) return;
    setRecentSearches(readSearchRecent());
  }, [open, q.length]);

  useEffect(() => {
    if (!open) return;
    if (q.length < SEARCH_MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      apiGetStorefrontVendorProducts(
        `search=${encodeURIComponent(q)}&limit=${SEARCH_SUGGEST_LIMIT}`,
      )
        .then((res) => {
          setSuggestions(Array.isArray(res.data?.products) ? res.data.products : []);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  const runProductSearch = (term) => {
    const t = String(term || '').trim();
    if (!t) return;
    writeSearchRecent(t);
    router.push(`/products?search=${encodeURIComponent(t)}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    runProductSearch(search);
  };

  return (
    <div className="bg-[#f5f5f5] border-b">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Search Bar */}
        <div ref={wrapRef} className="flex-1 relative w-full min-w-0 max-w-2xl">
          <form onSubmit={handleSearchSubmit}>
            <Search
              size={18}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />

            <input
              type="text"
              placeholder='Try Searching "Samsung Washing Machine"'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onFocus={() => {
                setOpen(true);
                if (search.trim().length === 0) setRecentSearches(readSearchRecent());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
              }}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm sm:text-base"
            />
          </form>

          {search.length > 0 ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSearch('')}
            >
              <X size={16} />
            </button>
          ) : null}

          {open ? (
            <div
              role="listbox"
              aria-label="Search suggestions"
              className="absolute left-0 right-0 top-full z-[60] mt-2 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden"
            >
              {showRecentsOnly ? (
                <>
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Recent
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {recentSearches.slice(0, SEARCH_RECENT_MAX).map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            runProductSearch(term);
                            setOpen(false);
                          }}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 shrink-0">
                            <History size={16} />
                          </span>
                          <span className="text-sm text-gray-900 truncate">{term}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {recentSearches.length > 0 ? (
                    <div className="px-3 py-2 border-t border-gray-100 flex justify-end">
                      <button
                        type="button"
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          clearSearchRecentStorage();
                          setRecentSearches([]);
                        }}
                      >
                        Clear all
                      </button>
                    </div>
                  ) : null}
                </>
              ) : showSuggestionsPanel ? (
                <>
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Suggestions
                  </div>
                  {loading ? (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      Searching…
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      No results found
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {suggestions.slice(0, SEARCH_SUGGEST_LIMIT).map((p) => (
                        <li key={p._id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              runProductSearch(p.productName);
                              setOpen(false);
                            }}
                          >
                            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                              <img
                                src={p.image || 'https://placehold.co/88x88/e5e7eb/6b7280?text=IMG'}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </span>
                            <span className="text-sm text-gray-900 truncate">
                              {p.productName}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Location */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('rn_open_location_modal'));
            }
          }}
          className="flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm whitespace-nowrap shrink-0 py-2 sm:py-0"
        >
          <MapPin size={16} className="text-orange-500 shrink-0" />
          <span className="text-gray-600 hidden sm:inline">Deliver to</span>
          <span className="text-orange-500 font-medium truncate max-w-[140px] sm:max-w-none">
            {deliveryLabel}
          </span>
          <ChevronDown size={16} className="text-gray-500 shrink-0" />
        </button>
      </div>
    </div>
  );
};

export default NavbarSecondary;
