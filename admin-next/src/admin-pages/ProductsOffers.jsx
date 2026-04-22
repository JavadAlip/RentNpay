'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  apiDeleteAdminOffer,
  apiGetAllAdminProducts,
  apiGetAdminOffers,
  apiUpsertAdminOffer,
} from '@/service/api';
import { toast } from 'react-toastify';
import { Heart, Search, ShoppingCart, Trash2, Truck } from 'lucide-react';

const STICKERS = [
  '',
  'Limited Deal',
  'Festival Offer',
  'Bestseller',
  'Hot Sale',
  'Clearance',
  'New Arrival',
];
const rupee = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatPercent = (n) => {
  const num = Number(n || 0);
  if (!Number.isFinite(num) || num <= 0) return '0%';
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
};
const parsePrice = (raw) => {
  const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};
const PLATFORM_FEE_PERCENT = 12;
const resolveDiscountPercent = (basePrice, draft = {}, offer = {}) => {
  const safeDraft = draft || {};
  const safeOffer = offer || {};
  const mode = safeDraft.discountType || 'percent';
  const rawValue = safeDraft.discountPercent ?? safeOffer.discountPercent ?? '';
  const n = Number(rawValue || 0);
  if (!Number.isFinite(n) || n <= 0 || basePrice <= 0) return 0;
  if (mode === 'amount')
    return Math.min(100, Math.max(0, (n / basePrice) * 100));
  return Math.min(100, Math.max(0, n));
};
const getDeliveryEtaLabel = (product) => {
  const lv = product?.logisticsVerification || {};
  const n = Number(lv.deliveryTimelineValue);
  const unit = String(lv.deliveryTimelineUnit || 'Days').toLowerCase();
  if (!Number.isFinite(n) || n <= 0) return 'Varies';
  if (unit === 'hours') return `${n} hour${n !== 1 ? 's' : ''}`;
  return `${n} day${n !== 1 ? 's' : ''}`;
};

export default function ProductsOffers() {
  const pageSize = 10;
  const [products, setProducts] = useState([]);
  const [offersByProduct, setOffersByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [search, setSearch] = useState('');
  const [draftByProduct, setDraftByProduct] = useState({});
  const [selectedPreviewProductId, setSelectedPreviewProductId] = useState('');
  const [page, setPage] = useState(1);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [productsRes, offersRes] = await Promise.all([
        apiGetAllAdminProducts(token, 'limit=200'),
        apiGetAdminOffers(token),
      ]);
      const prods = productsRes.data?.products || [];
      const offers = offersRes.data?.offers || [];
      const map = {};
      offers.forEach((o) => {
        map[String(o.productId?._id || o.productId)] = o;
      });
      const drafts = {};
      prods.forEach((p) => {
        const id = String(p._id);
        const off = map[id] || {};
        drafts[id] = {
          discountPercent:
            off.discountPercent != null ? String(off.discountPercent) : '',
          discountType: 'percent',
          sticker: off.sticker || '',
          isActive: off.isActive ?? false,
        };
      });
      setProducts(
        prods.filter((p) => String(p.type || '').toLowerCase() === 'rental'),
      );
      setOffersByProduct(map);
      setDraftByProduct(drafts);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to load products/offers',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = products.filter(
      (p) => String(p.type || '').toLowerCase() === 'rental',
    );
    if (!q) return base;
    return base.filter((p) =>
      String(p.productName || '')
        .toLowerCase()
        .includes(q),
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!rows.length) {
      setSelectedPreviewProductId('');
      return;
    }
    const exists = rows.some(
      (p) => String(p._id) === String(selectedPreviewProductId),
    );
    if (!exists) setSelectedPreviewProductId(String(rows[0]._id));
  }, [rows, selectedPreviewProductId]);

  const applyOffer = async (productId) => {
    const product = rows.find((p) => String(p._id) === String(productId));
    const basePrice = parsePrice(product?.price);
    const draft = draftByProduct[productId] || {};
    const mode = draft.discountType || 'percent';
    const raw = Number(draft.discountPercent || 0);
    if (mode === 'amount') {
      if (!raw || raw <= 0) {
        toast.error('Discount amount must be greater than 0');
        return;
      }
      if (!basePrice || raw > basePrice) {
        toast.error('Discount amount cannot be more than product price');
        return;
      }
    } else if (!raw || raw < 1 || raw > 100) {
      toast.error('Discount percent must be between 1 and 100');
      return;
    }
    const discountPercent = resolveDiscountPercent(basePrice, draft, {});
    setSavingId(productId);
    try {
      await apiUpsertAdminOffer(
        {
          productId,
          discountPercent,
          sticker: draft.sticker || '',
          isActive: draft.isActive ?? true,
        },
        token,
      );
      toast.success('Offer saved');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save offer');
    } finally {
      setSavingId('');
    }
  };

  const removeOffer = async (productId) => {
    const offer = offersByProduct[productId];
    if (!offer?._id) return;
    setSavingId(productId);
    try {
      await apiDeleteAdminOffer(offer._id, token);
      toast.success('Offer deleted');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete offer');
    } finally {
      setSavingId('');
    }
  };

  const preview =
    rows.find((p) => String(p._id) === String(selectedPreviewProductId)) ||
    null;
  const previewOffer = preview ? offersByProduct[String(preview._id)] : null;
  const previewDraft = preview ? draftByProduct[String(preview._id)] : null;
  const previewBase = parsePrice(preview?.price);
  const previewDiscount = resolveDiscountPercent(
    previewBase,
    previewDraft,
    previewOffer,
  );
  const previewFinal = Math.max(
    0,
    Math.round(previewBase - (previewBase * previewDiscount) / 100),
  );
  const previewSticker =
    previewDraft?.sticker || previewOffer?.sticker || 'Bestseller';
  const previewDiscountAmount = Math.max(0, previewBase - previewFinal);
  const previewDeliveryEta = getDeliveryEtaLabel(preview);
  const previewRating = (
    4 +
    ((preview?.productName?.length || 3) % 10) / 10
  ).toFixed(1);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Product Offers & Promotions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage promotional offers for products and services
          </p>
        </div>
        <button
          type="button"
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg hover:bg-blue-700"
        >
          + Create New Offer
        </button>
      </div>

      <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">
        Admin-Initiated Offers
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products or offers..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-14">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-gray-500 text-[11px] uppercase tracking-wide">
                    <th className="px-3 py-3 text-left font-medium">
                      Product Details
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Original Price
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Platform Fee
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Final Payout
                    </th>
                    <th className="px-3 py-3 text-left font-medium">
                      Discount on platform fee
                    </th>
                    <th className="px-3 py-3 text-left font-medium">Sticker</th>
                    <th className="px-3 py-3 text-right font-medium">
                      Final Price
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((p) => {
                    const id = String(p._id);
                    const offer = offersByProduct[id] || {};
                    const draft = draftByProduct[id] || {};
                    const base = parsePrice(p.price);
                    const discountPercent = resolveDiscountPercent(
                      base,
                      draft,
                      offer,
                    );
                    const finalPrice = Math.max(
                      0,
                      Math.round(base - (base * discountPercent) / 100),
                    );
                    const effectivePlatformFeePercent =
                      discountPercent > 0
                        ? discountPercent
                        : PLATFORM_FEE_PERCENT;
                    const platformCommission = Math.round(
                      finalPrice * (effectivePlatformFeePercent / 100),
                    );
                    const payout = Math.max(0, finalPrice - platformCommission);

                    return (
                      <tr
                        key={id}
                        onClick={() => setSelectedPreviewProductId(id)}
                        className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.image}
                              alt=""
                              className="w-9 h-9 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {p.productName}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDraftByProduct((prev) => ({
                                      ...prev,
                                      [id]: {
                                        ...(prev[id] || {}),
                                        isActive: !(
                                          prev[id]?.isActive ??
                                          offer.isActive ??
                                          false
                                        ),
                                      },
                                    }));
                                  }}
                                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${
                                    (draft.isActive ?? offer.isActive)
                                      ? 'bg-orange-500'
                                      : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                                      (draft.isActive ?? offer.isActive)
                                        ? 'translate-x-3.5'
                                        : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                                <p className="text-[11px] text-gray-500">
                                  {draft.sticker ||
                                    offer.sticker ||
                                    'Bestseller'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-gray-700">
                          {rupee(base)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="text-blue-600 text-[11px] font-medium">
                            {formatPercent(effectivePlatformFeePercent)}
                          </p>
                          <p className="text-gray-600 text-[11px]">
                            {rupee(platformCommission)}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right text-emerald-600 font-medium">
                          {rupee(payout)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDraftByProduct((prev) => ({
                                    ...prev,
                                    [id]: {
                                      ...(prev[id] || {}),
                                      discountType: 'percent',
                                    },
                                  }));
                                }}
                                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold ${
                                  (draft.discountType || 'percent') ===
                                  'percent'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                %
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDraftByProduct((prev) => ({
                                    ...prev,
                                    [id]: {
                                      ...(prev[id] || {}),
                                      discountType: 'amount',
                                    },
                                  }));
                                }}
                                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold ${
                                  draft.discountType === 'amount'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                ₹
                              </button>
                            </div>
                            <input
                              type="number"
                              min={1}
                              max={
                                draft.discountType === 'amount'
                                  ? Math.max(1, base)
                                  : 100
                              }
                              value={draft.discountPercent ?? ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setDraftByProduct((prev) => ({
                                  ...prev,
                                  [id]: {
                                    ...(prev[id] || {}),
                                    discountPercent: e.target.value,
                                  },
                                }))
                              }
                              className="w-20 px-2 py-1.5 border border-gray-200 rounded text-xs"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={draft.sticker ?? ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setDraftByProduct((prev) => ({
                                ...prev,
                                [id]: {
                                  ...(prev[id] || {}),
                                  sticker: e.target.value,
                                },
                              }))
                            }
                            className="w-28 px-2 py-1.5 border border-gray-200 rounded text-xs bg-white"
                          >
                            {STICKERS.map((s) => (
                              <option key={s || 'none'} value={s}>
                                {s || 'None'}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-right text-emerald-600 font-semibold">
                          {discountPercent ? rupee(finalPrice) : '-'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                applyOffer(id);
                              }}
                              disabled={savingId === id}
                              className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs disabled:opacity-60"
                            >
                              {savingId === id ? 'Saving...' : 'Apply'}
                            </button>
                            {offer?._id ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeOffer(id);
                                }}
                                disabled={savingId === id}
                                className="inline-flex items-center gap-1 text-red-600 text-xs font-medium disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pagedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No rental products found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
          {!loading && rows.length > 0 ? (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, rows.length)} of {rows.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded border border-gray-200 text-gray-600 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="font-medium text-gray-700">
                  {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded border border-gray-200 text-gray-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden">
            <div className="p-4 border-b border-blue-200 bg-blue-50/70">
              <h3 className="text-sm font-semibold text-gray-900">
                Customer Preview
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                How this offer will appear to customers
              </p>
            </div>
            {preview ? (
              <div className="p-4">
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                  <div className="relative">
                    <img
                      src={preview.image}
                      alt=""
                      className="w-full h-40 object-cover"
                    />
                    <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-orange-500 text-white text-[10px] font-medium px-2 py-0.5">
                      {previewSticker || 'Bestseller'}
                    </span>
                    <span className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white text-sm font-bold leading-none shadow-sm">
                      {formatPercent(previewDiscount)}
                    </span>
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 text-blue-700 text-[10px] font-medium px-2 py-0.5">
                      <Truck className="w-3 h-3" />
                      {previewDeliveryEta}
                    </span>
                    <button
                      type="button"
                      className="absolute bottom-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-gray-500 border border-gray-200"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-medium text-gray-900 line-clamp-1">
                        {preview.productName}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 shrink-0">
                        {previewRating} ★
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-0.5">
                        {String(
                          preview.condition || preview.type || 'Used - Good',
                        )}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div className="flex items-end gap-1.5">
                        <span className="text-[28px] leading-none font-semibold text-gray-900">
                          {previewDiscount
                            ? rupee(previewFinal)
                            : rupee(previewBase)}
                        </span>
                        {previewDiscount ? (
                          <span className="text-xs text-gray-400 line-through mb-1">
                            {rupee(previewBase)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button className="mt-4 w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium inline-flex items-center justify-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="p-4 text-sm text-gray-500">
                No products to preview.
              </p>
            )}
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 text-xs">
            <p className="text-gray-600">Offer Impact</p>
            <div className="mt-2 flex justify-between">
              <span>Discount Amount:</span>
              <span className="font-medium text-rose-600">
                {rupee(previewDiscountAmount)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Customer Saves:</span>
              <span className="font-medium text-emerald-700">
                {formatPercent(previewDiscount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
