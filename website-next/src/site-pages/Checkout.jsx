'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { syncCart } from '../store/slices/cartSlice';
import {
  apiGetMyAddresses,
  apiCreateAddress,
  apiUpdateAddress,
  apiDeleteAddress,
} from '@/lib/api';
import { useAuthModal, AUTH_REDIRECT_SESSION_KEY } from '@/contexts/AuthModalContext';

function getUserId(user) {
  return user?.id || user?._id || null;
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
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Select Delivery Address
            </h2>

            <div className="mt-4 space-y-3">
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
                    className={`rounded-2xl border p-4 cursor-pointer ${active ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-200'}`}
                    onClick={() => setSelectedId(addr._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${active ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}>
                            {active ? <span className="w-2 h-2 bg-white rounded-full" /> : null}
                          </span>
                          <p className="font-semibold text-gray-900 truncate">
                            {addr.fullName}
                          </p>
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

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={openAddModal}
                className="px-4 py-2 text-sm rounded-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800"
              >
                + Add New Address
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <h3 className="font-semibold text-gray-900">Delivery Instructions</h3>
            <p className="text-xs text-gray-500 mt-1">
              Optional: add gate code, delivery notes, etc.
            </p>
            <textarea
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              rows={3}
              className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="e.g., Leave at reception / ring bell once"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 h-fit sticky top-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Order Summary
          </h2>

          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate">
                  {i.title} × {i.quantity}
                </span>
                <span className="font-medium text-gray-900">
                  ₹
                  {(
                    (String(i.productType || 'Rental') === 'Rental'
                      ? Number(i.pricePerDay) *
                        Number(i.rentalMonths || 1) *
                        Number(i.quantity)
                      : Number(i.pricePerDay) * Number(i.quantity))
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total Payable</span>
            <span className="text-xl font-bold text-orange-500">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            type="button"
            onClick={proceedToPayment}
            className="mt-6 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
          >
            Proceed to Payment
          </button>
        </div>
      </div>

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
