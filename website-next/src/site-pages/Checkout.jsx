'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, Store, Star, Navigation } from 'lucide-react';
import { syncCart } from '../store/slices/cartSlice';
import {
  apiGetMyAddresses,
  apiGetCheckoutPickupStores,
  apiCreateAddress,
  apiUpdateAddress,
  apiDeleteAddress,
} from '@/lib/api';
import { useAuthModal, AUTH_REDIRECT_SESSION_KEY } from '@/contexts/AuthModalContext';

function getUserId(user) {
  return user?.id || user?._id || null;
}

function toRad(v) {
  return (Number(v) * Math.PI) / 180;
}

function distanceKm(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const dLat = toRad(Number(bLat) - Number(aLat));
  const dLon = toRad(Number(bLon) - Number(aLon));
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const x = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export default function Checkout() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { openAuth } = useAuthModal();

  const { items } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  const userId = useMemo(() => getUserId(user), [user]);

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const selectedAddress = useMemo(
    () => addresses.find((a) => a._id === selectedId) || null,
    [addresses, selectedId],
  );

  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);
  const [billingGstin, setBillingGstin] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState('');
  const [pickupStores, setPickupStores] = useState([]);
  const [mapPreviewOpen, setMapPreviewOpen] = useState(false);
  const [checkoutFocusProductId, setCheckoutFocusProductId] = useState('');
  const [form, setForm] = useState({
    label: 'Home',
    fullName: user?.fullName || '',
    phone: '',
    area: '',
    addressLine: '',
    city: '',
    pincode: '',
  });

  const total = useMemo(
    () =>
      items.reduce(
        (sum, i) =>
          sum +
          (String(i.productType || 'Rental') === 'Rental'
            ? Number(i.pricePerDay) *
              Number(i.rentalMonths || 1) *
              Number(i.quantity)
            : Number(i.pricePerDay) * Number(i.quantity)),
        0,
      ),
    [items],
  );

  const locationCoords = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('rn_delivery_location');
      const parsed = raw ? JSON.parse(raw) : null;
      const lat = Number(parsed?.lat);
      const lon = Number(parsed?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return { lat, lon };
    } catch {
      return null;
    }
  }, [selectedId, addresses.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem('rentpay_checkout_focus_product_id') || '';
    setCheckoutFocusProductId(saved);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!checkoutFocusProductId) return;
    const existsInCart = items.some(
      (item) => String(item?.productId || '') === String(checkoutFocusProductId),
    );
    if (existsInCart) return;
    sessionStorage.removeItem('rentpay_checkout_focus_product_id');
    setCheckoutFocusProductId('');
  }, [checkoutFocusProductId, items]);

  const primaryPickupStore = useMemo(() => {
    if (!pickupStores.length) return null;
    const primaryProductId = String(
      checkoutFocusProductId || items?.[items.length - 1]?.productId || items?.[0]?.productId || '',
    );
    if (!primaryProductId) return pickupStores[0] || null;
    const matched = pickupStores.find((s) =>
      Array.isArray(s?.products)
        ? s.products.some((p) => String(p?.productId || '') === primaryProductId)
        : false,
    );
    return matched || pickupStores[0] || null;
  }, [pickupStores, items, checkoutFocusProductId]);
  const pickupDistanceText = useMemo(() => {
    if (!primaryPickupStore || !locationCoords) return '';
    const sLat = Number(primaryPickupStore.mapLat);
    const sLng = Number(primaryPickupStore.mapLng);
    if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) return '';
    const d = distanceKm(locationCoords.lat, locationCoords.lon, sLat, sLng);
    if (!Number.isFinite(d)) return '';
    return `${d < 10 ? d.toFixed(1) : Math.round(d)} km away from your location`;
  }, [primaryPickupStore, locationCoords]);

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/cart');
      return;
    }
    if (!userId) {
      sessionStorage.setItem(AUTH_REDIRECT_SESSION_KEY, '/checkout');
      openAuth('login');
      return;
    }
  }, [items.length, router, userId, dispatch, openAuth]);

  useEffect(() => {
    if (!userId) return;
    dispatch(syncCart());
    apiGetMyAddresses()
      .then((res) => {
        const list = res.data?.addresses || [];
        setAddresses(list);
        if (list.length > 0) setSelectedId((prev) => prev || list[0]._id);
      })
      .catch(() => setAddresses([]));
  }, [userId]);

  useEffect(() => {
    if (!addresses.length) setSelectedId(null);
  }, [addresses]);

  useEffect(() => {
    if (!userId || !items.length) {
      setPickupStores([]);
      setPickupError('');
      setPickupLoading(false);
      return;
    }
    setPickupLoading(true);
    setPickupError('');
    setPickupStores([]);
    const ids = items.map((x) => x.productId).filter(Boolean);
    apiGetCheckoutPickupStores(ids)
      .then((res) => {
        setPickupStores(Array.isArray(res.data?.stores) ? res.data.stores : []);
      })
      .catch((err) => {
        setPickupStores([]);
        setPickupError(err.response?.data?.message || 'Could not load pickup store details.');
      })
      .finally(() => setPickupLoading(false));
  }, [userId, items]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setForm({
      label: 'Home',
      fullName: user?.fullName || '',
      phone: '',
      area: '',
      addressLine: '',
      city: '',
      pincode: '',
    });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setModalMode('edit');
    setEditingId(addr._id);
    setForm({
      label: addr.label || 'Home',
      fullName: addr.fullName || user?.fullName || '',
      phone: addr.phone || '',
      area: addr.area || '',
      addressLine: addr.addressLine || '',
      city: addr.city || '',
      pincode: addr.pincode || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSaveAddress = () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.addressLine.trim()) {
      setError('Please fill name, phone and address line.');
      return;
    }

    const payload = {
      label: form.label,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      area: form.area.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
    };

    setError('');
    if (modalMode === 'edit' && editingId) {
      apiUpdateAddress(editingId, payload)
        .then((res) => {
          const updated = res.data?.address;
          if (!updated) return;
          setAddresses((prev) =>
            prev.map((a) => (a._id === updated._id ? updated : a)),
          );
          setSelectedId(updated._id);
          setModalOpen(false);
        })
        .catch((err) =>
          setError(err.response?.data?.message || 'Could not update address.'),
        );
      return;
    }

    apiCreateAddress(payload)
      .then((res) => {
        const created = res.data?.address;
        if (!created) return;
        setAddresses((prev) => [created, ...prev]);
        setSelectedId(created._id);
        setModalOpen(false);
      })
      .catch((err) =>
        setError(err.response?.data?.message || 'Could not save address.'),
      );
  };

  const handleDeleteAddress = (id) => {
    apiDeleteAddress(id)
      .then(() => {
        setAddresses((prev) => prev.filter((a) => a._id !== id));
        if (selectedId === id) setSelectedId(null);
      })
      .catch((err) =>
        setError(err.response?.data?.message || 'Could not delete address.'),
      );
  };

  const proceedToPayment = () => {
    const rentalMonthsValues = items
      .filter((i) => String(i.productType || 'Rental') === 'Rental')
      .map((i) => i.rentalMonths || 1);
    const first = rentalMonthsValues[0];
    const allSame = rentalMonthsValues.every((v) => v === first);
    if (!allSame) {
      setError('Please keep the same rental duration for all items in your cart.');
      return;
    }

    if (!selectedAddress) {
      setError('Please select or add a delivery address.');
      return;
    }

    localStorage.setItem(
      'rentpay_checkout_selectedAddress',
      JSON.stringify(selectedAddress),
    );
    localStorage.setItem(
      'rentpay_checkout_instructions',
      JSON.stringify(deliveryInstructions),
    );
    localStorage.setItem(
      'rentpay_checkout_billing',
      JSON.stringify({
        billingSameAsDelivery,
        gstin: billingGstin,
      }),
    );
    router.push('/payment');
  };

  if (items.length === 0) return null;
  if (!userId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#eff2f8] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review your delivery details and complete your order
        </p>

        <div className="mt-6 space-y-4">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-gray-900">Select Delivery Address</h2>

            <div className="mt-4 space-y-2.5">
              {addresses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">
                    No saved addresses yet.
                  </p>
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="px-5 py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
                  >
                    Add New Address
                  </button>
                </div>
              )}

              {addresses.map((addr) => {
                const active = addr._id === selectedId;
                const addressLine = `${addr.addressLine}${addr.area ? `, ${addr.area}` : ''}${addr.city ? `, ${addr.city}` : ''}${addr.pincode ? ` - ${addr.pincode}` : ''}`;
                return (
                  <div
                    key={addr._id}
                    className={`rounded-xl border p-3 cursor-pointer ${
                      active
                        ? 'border-orange-400 bg-orange-50/20 ring-1 ring-orange-100'
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setSelectedId(addr._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${active ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}>
                            {active ? <span className="w-2 h-2 bg-white rounded-full" /> : null}
                          </span>
                          <div className="min-w-0 flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">
                              {addr.fullName}
                            </p>
                            <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                              {addr.label || 'Home'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {addressLine}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {addr.phone}
                        </p>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(addr);
                          }}
                          className="text-xs text-gray-700 hover:text-orange-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(addr._id);
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={openAddModal}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                + Add New Address
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-gray-900">Pick-up Store</h2>
            {pickupLoading ? (
              <p className="mt-3 text-sm text-gray-500">Loading pickup details...</p>
            ) : pickupError ? (
              <p className="mt-3 text-sm text-red-600">{pickupError}</p>
            ) : !primaryPickupStore ? (
              <p className="mt-3 text-sm text-gray-500">Pickup details unavailable.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-gray-200 px-3 py-2.5">
                  <p className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    Pick up from Partner Store
                  </p>
                  <p className="mt-1 text-xs flex items-center gap-1 text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {primaryPickupStore.rating || 4.9} <span className="text-gray-500">(Store Rating)</span>
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-3">
                  <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Pickup Location
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {primaryPickupStore.mapAddress || primaryPickupStore.storeName}
                  </p>
                  {pickupDistanceText ? (
                    <p className="text-xs text-emerald-700 mt-0.5">{pickupDistanceText}</p>
                  ) : null}
                  <div className="mt-2 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-[11px] text-gray-500 inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Exact address shared after payment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapPreviewOpen(true)}
                    className="mt-2 w-full rounded-lg border border-emerald-400 text-emerald-700 text-sm font-medium py-2 hover:bg-emerald-50 inline-flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    View on Map
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-gray-900">Billing Address</h2>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={billingSameAsDelivery}
                onChange={(e) => setBillingSameAsDelivery(e.target.checked)}
                className="rounded border-gray-300"
              />
              My Billing address is the same as Delivery address
            </label>
            <div className="mt-3">
              <label className="text-xs text-gray-500">Use GSTIN for Business Invoice</label>
              <input
                type="text"
                value={billingGstin}
                onChange={(e) => setBillingGstin(e.target.value.toUpperCase())}
                placeholder="Optional GSTIN"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900">Delivery Instructions</h3>
            <p className="text-xs text-gray-500 mt-1">Delivery instructions (Optional)</p>
            <textarea
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              rows={3}
              className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="e.g., Leave at security gate. Call before arriving"
            />
          </section>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="button"
            onClick={proceedToPayment}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
          >
            Proceed for Payment
          </button>
        </div>
      </div>

      {mapPreviewOpen && primaryPickupStore ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setMapPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <p className="font-semibold text-gray-900">Store Location Preview</p>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setMapPreviewOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="h-[420px] w-full">
              <iframe
                title="Store map preview"
                src={
                  Number.isFinite(Number(primaryPickupStore?.mapLat)) &&
                  Number.isFinite(Number(primaryPickupStore?.mapLng))
                    ? `https://www.google.com/maps?q=${encodeURIComponent(
                        `${primaryPickupStore.mapLat},${primaryPickupStore.mapLng}`,
                      )}&z=15&output=embed`
                    : `https://www.google.com/maps?q=${encodeURIComponent(
                        primaryPickupStore?.mapAddress || primaryPickupStore?.storeName || '',
                      )}&z=15&output=embed`
                }
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'edit' ? 'Edit Address' : 'Add New Address'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  This address is saved for your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-700">
                  Label
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="text-xs font-medium text-gray-700">
                  Phone
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="e.g., 9876543210"
                  />
                </label>
              </div>

              <label className="text-xs font-medium text-gray-700 block">
                Full name
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="text-xs font-medium text-gray-700 block">
                Address line
                <input
                  type="text"
                  value={form.addressLine}
                  onChange={(e) => setForm((p) => ({ ...p, addressLine: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="House no., street name"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-700 block">
                  Area
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="Area / locality"
                  />
                </label>
                <label className="text-xs font-medium text-gray-700 block">
                  Pincode
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="411057"
                  />
                </label>
              </div>

              <label className="text-xs font-medium text-gray-700 block">
                City
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Pune"
                />
              </label>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAddress}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
