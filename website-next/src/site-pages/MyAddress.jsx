'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Home, Building2 } from 'lucide-react';
import {
  apiCreateAddress,
  apiDeleteAddress,
  apiGetMyAddresses,
  apiUpdateAddress,
} from '@/lib/api';

function formatAddressLine(addr) {
  return [
    addr?.addressLine,
    addr?.area,
    addr?.city,
    addr?.pincode ? `- ${addr.pincode}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

export default function MyAddress() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit');
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    area: '',
    addressLine: '',
    city: '',
    pincode: '',
  });

  useEffect(() => {
    setLoading(true);
    setError('');
    apiGetMyAddresses()
      .then((res) => {
        setAddresses(
          Array.isArray(res.data?.addresses) ? res.data.addresses : [],
        );
      })
      .catch((err) => {
        setAddresses([]);
        setError(err?.response?.data?.message || 'Failed to load addresses.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!modalOpen && !deleteTarget) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen, deleteTarget]);

  const sorted = useMemo(() => {
    return [...addresses].sort((a, b) => {
      if (a?.isDefault && !b?.isDefault) return -1;
      if (!a?.isDefault && b?.isDefault) return 1;
      return 0;
    });
  }, [addresses]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setForm({
      label: 'Home',
      fullName: '',
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
    setEditingId(addr?._id || null);
    setForm({
      label: addr?.label || 'Home',
      fullName: addr?.fullName || '',
      phone: addr?.phone || addr?.mobileNumber || '',
      area: addr?.area || '',
      addressLine: addr?.addressLine || '',
      city: addr?.city || '',
      pincode: addr?.pincode || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSaveAddress = () => {
    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.addressLine.trim()
    ) {
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
          setModalOpen(false);
        })
        .catch((err) =>
          setError(err?.response?.data?.message || 'Could not update address.'),
        );
      return;
    }

    apiCreateAddress(payload)
      .then((res) => {
        const created = res.data?.address;
        if (!created) return;
        setAddresses((prev) => [created, ...prev]);
        setModalOpen(false);
      })
      .catch((err) =>
        setError(err?.response?.data?.message || 'Could not save address.'),
      );
  };

  const handleDeleteAddress = () => {
    if (!deleteTarget?._id) return;
    apiDeleteAddress(deleteTarget._id)
      .then(() => {
        setAddresses((prev) => prev.filter((a) => a._id !== deleteTarget._id));
        setDeleteTarget(null);
      })
      .catch((err) =>
        setError(err?.response?.data?.message || 'Could not delete address.'),
      );
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] py-8 px-3 sm:px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1A3A] tracking-tight">
              My Address
            </h1>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
          >
            + Add Address
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#FF6F00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
            {error}
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <p className="text-gray-700 font-medium">No saved addresses yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Add an address during checkout to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((addr) => (
              <article
                key={addr._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 inline-flex items-center gap-2">
                      {String(addr?.label || '')
                        .toLowerCase()
                        .includes('home') ? (
                        <Home className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Building2 className="w-4 h-4 text-orange-500" />
                      )}
                      {addr?.label || 'Address'}
                    </p>
                    <p className="text-sm text-gray-700 mt-1 break-words">
                      {formatAddressLine(addr)}
                    </p>
                    {addr?.mobileNumber || addr?.phone ? (
                      <p className="text-xs text-gray-500 mt-2">
                        Phone: {addr.mobileNumber || addr.phone}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    {addr?.isDefault ? (
                      <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
                        Default
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openEditModal(addr)}
                      className="text-xs text-gray-700 hover:text-orange-600 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(addr)}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {modalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'edit' ? 'Edit Address' : 'Add Address'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {modalMode === 'edit'
                    ? 'Update this saved address.'
                    : 'Add a new address for your account.'}
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

            <div className="modal-scroll p-5 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-700">
                  Label
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, label: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="text-xs font-medium text-gray-700">
                  Phone
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>

              <label className="text-xs font-medium text-gray-700 block">
                Full name
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="text-xs font-medium text-gray-700 block">
                Address line
                <input
                  type="text"
                  value={form.addressLine}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, addressLine: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-700 block">
                  Area
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, area: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="text-xs font-medium text-gray-700 block">
                  Pincode
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, pincode: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>

              <label className="text-xs font-medium text-gray-700 block">
                City
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, city: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>

              {error ? <p className="text-red-600 text-sm">{error}</p> : null}

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
      ) : null}
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Delete Address</h3>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-medium text-gray-900">
                  {deleteTarget.label || 'this address'}
                </span>
                ?
              </p>
            </div>
            <div className="p-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAddress}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <style jsx>{`
        .modal-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .modal-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
