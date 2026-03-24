'use client';

import { useEffect, useMemo, useState } from 'react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { useSelector } from 'react-redux';
import {
  apiDeleteVendorOffer,
  apiGetMyProducts,
  apiGetVendorOffers,
  apiUpsertVendorOffer,
} from '@/service/api';
import { toast } from 'react-toastify';

const STICKERS = ['', 'Bestseller', 'Limited Deal', 'New Arrival', 'Hot Deal'];

const parsePrice = (raw) => {
  const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

const rupee = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const toDateInputValue = (dateLike) => {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export default function VendorOffersPage() {
  const { user, token } = useSelector((s) => s.vendor);
  const [products, setProducts] = useState([]);
  const [offersByProduct, setOffersByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState('');
  const [selectedPreviewProductId, setSelectedPreviewProductId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm] = useState({
    productId: '',
    discountPercent: '',
    sticker: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const authToken =
    token ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('vendorToken')
      : null);

  const loadData = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const [productsRes, offersRes] = await Promise.all([
        apiGetMyProducts(authToken),
        apiGetVendorOffers(authToken),
      ]);
      const prods = productsRes.data?.products || [];
      const offers = offersRes.data?.offers || [];
      const map = {};
      offers.forEach((o) => {
        map[String(o.productId?._id || o.productId)] = o;
      });
      setProducts(prods);
      setOffersByProduct(map);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load offers data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [authToken]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = products.filter((p) => p.type === 'Rental');
    if (!q) return base;
    return base.filter((p) =>
      String(p.productName || '')
        .toLowerCase()
        .includes(q),
    );
  }, [products, search]);

  const rentalProducts = useMemo(
    () => products.filter((p) => p.type === 'Rental'),
    [products],
  );

  useEffect(() => {
    if (!rows.length) {
      setSelectedPreviewProductId('');
      return;
    }
    const exists = rows.some(
      (p) => String(p._id) === String(selectedPreviewProductId),
    );
    if (!exists) {
      setSelectedPreviewProductId(String(rows[0]._id));
    }
  }, [rows, selectedPreviewProductId]);

  const openCreateModal = () => {
    setModalMode('create');
    setForm({
      productId: '',
      discountPercent: '',
      sticker: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (productId) => {
    const offer = offersByProduct[productId] || {};
    setModalMode('edit');
    setForm({
      productId,
      discountPercent: offer.discountPercent ?? '',
      sticker: offer.sticker || '',
      startDate: toDateInputValue(offer.startDate),
      endDate: toDateInputValue(offer.endDate),
      isActive: offer.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const removeOffer = async (productId) => {
    const offer = offersByProduct[productId];
    if (!offer?._id) return;
    setSavingId(productId);
    try {
      await apiDeleteVendorOffer(offer._id, authToken);
      toast.success('Offer removed');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove offer');
    } finally {
      setSavingId('');
    }
  };

  const submitOffer = async () => {
    const productId = String(form.productId || '');
    const discountPercent = Number(form.discountPercent || 0);
    if (!productId) {
      toast.error('Please select a product');
      return;
    }
    if (!discountPercent || discountPercent < 1 || discountPercent > 95) {
      toast.error('Discount must be between 1 and 95');
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast.error('End date must be after start date');
      return;
    }

    setSavingId(productId);
    try {
      await apiUpsertVendorOffer(
        {
          productId,
          discountPercent,
          sticker: form.sticker || '',
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          isActive: form.isActive,
        },
        authToken,
      );
      toast.success(modalMode === 'create' ? 'Offer created' : 'Offer updated');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save offer');
    } finally {
      setSavingId('');
    }
  };

  const preview =
    rows.find((p) => String(p._id) === String(selectedPreviewProductId)) ||
    null;
  const previewOffer = preview ? offersByProduct[String(preview._id)] : null;
  const previewBase = parsePrice(preview?.price);
  const previewDiscount = Number(previewOffer?.discountPercent || 0);
  const previewFinal = Math.max(
    0,
    Math.round(previewBase - (previewBase * previewDiscount) / 100),
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f3f5f9]">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Product Offers & Promotions
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Create and manage promotional offers for your products
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm shadow"
            >
              + Create New Offer
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products or offers..."
                  className="w-full md:max-w-sm px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-14">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-3 text-left font-medium">
                          Product Details
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Original Price
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Discount
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Duration
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Sticker
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Final Price
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => {
                        const id = String(p._id);
                        const base = parsePrice(p.price);
                        const offer = offersByProduct[id] || {};
                        const discountPercent = Number(
                          offer.discountPercent || 0,
                        );
                        const final = Math.max(
                          0,
                          Math.round(base - (base * discountPercent) / 100),
                        );
                        const start = toDateInputValue(offer.startDate);
                        const end = toDateInputValue(offer.endDate);
                        return (
                          <tr
                            key={id}
                            onClick={() => setSelectedPreviewProductId(id)}
                            className={`border-t border-gray-100 cursor-pointer transition ${
                              String(selectedPreviewProductId) === id
                                ? 'bg-orange-50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.image}
                                  alt=""
                                  className="w-10 h-10 rounded object-cover"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {p.productName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {p.category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">{rupee(base)}</td>
                            <td className="px-3 py-3">
                              {discountPercent ? `${discountPercent}%` : '-'}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-600">
                              {start || end
                                ? `${start || 'Any'} - ${end || 'Any'}`
                                : 'Always on'}
                            </td>
                            <td className="px-3 py-3">
                              {offer.sticker || '-'}
                            </td>
                            <td className="px-3 py-3 text-emerald-600 font-semibold">
                              {discountPercent ? rupee(final) : '-'}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => openEditModal(id)}
                                  className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs"
                                >
                                  {offer?._id ? 'Edit' : 'Create'}
                                </button>
                                {offer?._id ? (
                                  <button
                                    onClick={() => removeOffer(id)}
                                    disabled={savingId === id}
                                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                  >
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Customer Preview
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    How this offer will appear to customers
                  </p>
                </div>
                {preview ? (
                  <div className="p-4">
                    <div className="rounded-xl border overflow-hidden">
                      <img
                        src={preview.image}
                        alt=""
                        className="w-full h-44 object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {preview.productName}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {previewDiscount
                              ? rupee(previewFinal)
                              : rupee(previewBase)}
                          </span>
                          {previewDiscount ? (
                            <span className="text-xs text-gray-400 line-through">
                              {rupee(previewBase)}
                            </span>
                          ) : null}
                        </div>
                        <button className="mt-3 w-full py-2 rounded-lg bg-orange-500 text-white text-sm">
                          Rent Now
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
                    {previewDiscount ? rupee(previewBase - previewFinal) : '₹0'}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Customer Saves:</span>
                  <span className="font-medium text-emerald-700">
                    {previewDiscount}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
              <div className="w-full max-w-xl rounded-2xl bg-white border border-gray-200 shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">
                    {modalMode === 'create'
                      ? 'Create New Offer'
                      : 'Update Offer'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Step 1: Select Product
                    </p>
                    <select
                      value={form.productId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          productId: e.target.value,
                        }))
                      }
                      disabled={modalMode === 'edit'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                    >
                      <option value="">Select rental product</option>
                      {rentalProducts.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.productName} ({rupee(parsePrice(p.price))}/mo)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Step 2: Discount Offer
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={95}
                      value={form.discountPercent}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          discountPercent: e.target.value,
                        }))
                      }
                      placeholder="Enter discount percentage (1-95)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Step 3: Marketing Label
                    </p>
                    <select
                      value={form.sticker}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          sticker: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {STICKERS.map((s) => (
                        <option key={s || 'none'} value={s}>
                          {s || 'None'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Step 4: Duration (Optional)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitOffer}
                      disabled={savingId === form.productId}
                      className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm disabled:opacity-60"
                    >
                      {savingId === form.productId
                        ? 'Saving...'
                        : modalMode === 'create'
                          ? 'Publish Offer'
                          : 'Update Offer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
