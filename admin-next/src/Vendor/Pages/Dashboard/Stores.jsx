'use client';

import { useEffect, useMemo, useState } from 'react';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import { apiGetMyVendorKyc, apiSubmitVendorKyc } from '@/service/api';

const emptyStore = {
  storeName: '',
  completeAddress: '',
  pincode: '',
  mapLocation: '',
  mapAddress: '',
  mapLat: null,
  mapLng: null,
  shopFrontPhotoName: '',
  shopFrontPhotoFile: null,
  shopFrontPhotoUrl: '',
  deliveryZoneType: 'pan-india',
  serviceRadiusKm: 15,
  serviceModeLocalDelivery: false,
  serviceModePanIndia: true,
  walkInAccessLabel: 'No Public Access',
  isDefault: false,
  isActive: true,
  allowsWalkIn: false,
  storeTimings: '',
};

export default function VendorStoresPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [stores, setStores] = useState([]);
  const [slaAccepted, setSlaAccepted] = useState(false);
  const [commissionAccepted, setCommissionAccepted] = useState(false);
  const [openIdx, setOpenIdx] = useState(-1);

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [draftStore, setDraftStore] = useState(emptyStore);
  const [editingStoreIdx, setEditingStoreIdx] = useState(-1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapQuery, setMapQuery] = useState('');
  const [mapResults, setMapResults] = useState([]);
  const [mapSearching, setMapSearching] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    if (!token) {
      setError('Please login again to continue.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    apiGetMyVendorKyc(token)
      .then((res) => {
        const kyc = res.data?.kyc || null;
        const list = Array.isArray(kyc?.storeManagement?.stores)
          ? kyc.storeManagement.stores
          : [];
        setStores(list);
        setOpenIdx(list.length ? 0 : -1);
        setSlaAccepted(Boolean(kyc?.storeManagement?.slaAccepted));
        setCommissionAccepted(Boolean(kyc?.storeManagement?.commissionAccepted));
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load stores.');
      })
      .finally(() => setLoading(false));
  }, []);

  const totalStores = stores.length;
  const activeStores = useMemo(
    () => stores.filter((s) => s.isActive !== false).length,
    [stores],
  );

  const openAddStore = () => {
    setEditingStoreIdx(-1);
    setDraftStore({
      ...emptyStore,
      isDefault: stores.length === 0,
    });
    setIsStoreModalOpen(true);
  };

  const openEditStore = (idx) => {
    setEditingStoreIdx(idx);
    setDraftStore({ ...emptyStore, ...(stores[idx] || {}) });
    setIsStoreModalOpen(true);
  };

  const removeStore = (idx) => {
    setStores((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveStoreDraft = () => {
    if (!draftStore.storeName.trim() || !draftStore.completeAddress.trim()) return;
    setStores((prev) => {
      if (editingStoreIdx >= 0) {
        return prev.map((s, i) => (i === editingStoreIdx ? draftStore : s));
      }
      return [...prev, draftStore];
    });
    setDraftStore(emptyStore);
    setEditingStoreIdx(-1);
    setIsStoreModalOpen(false);
  };

  const searchMapLocations = async () => {
    const q = mapQuery.trim();
    if (!q) return;
    setMapSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      setMapResults(Array.isArray(data) ? data : []);
    } catch {
      setMapResults([]);
    } finally {
      setMapSearching(false);
    }
  };

  const selectMapLocation = (place) => {
    const lat = Number(place?.lat || 0);
    const lng = Number(place?.lon || 0);
    const display = String(place?.display_name || '');
    const mapLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';
    setDraftStore((prev) => ({
      ...prev,
      mapLocation: mapLink,
      mapAddress: display,
      mapLat: lat || null,
      mapLng: lng || null,
    }));
    setIsMapModalOpen(false);
  };

  const saveStoresToKyc = async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    if (!token) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = new FormData();
      payload.append('step', '4');
      payload.append('finalSubmit', 'false');
      payload.append('stores', JSON.stringify(stores || []));
      payload.append('slaAccepted', slaAccepted ? 'true' : 'false');
      payload.append('commissionAccepted', commissionAccepted ? 'true' : 'false');

      (stores || []).forEach((s, i) => {
        if (s.shopFrontPhotoFile instanceof File) {
          payload.append(`storeFront_${i}`, s.shopFrontPhotoFile);
        }
      });

      await apiSubmitVendorKyc(payload, token);
      setStores((prev) =>
        prev.map((s) => ({ ...s, shopFrontPhotoFile: null })),
      );
      setSuccess('Stores updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stores.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <VendorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <VendorTopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f3f5f9]">
          <div className="max-w-5xl mx-auto space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Active Stores</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure your physical outlets and delivery zones.
              </p>
            </div>

            {error ? (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                {success}
              </div>
            ) : null}

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Manage Stores</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure your physical outlets and delivery zones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddStore}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700"
                >
                  + Add New Store
                </button>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-gray-100">
                <div className="rounded-xl border border-gray-200 bg-slate-50 p-3">
                  <p className="text-[11px] text-gray-500">Total Stores</p>
                  <p className="text-xl font-semibold text-gray-900">{totalStores}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] text-emerald-700">Active Stores</p>
                  <p className="text-xl font-semibold text-emerald-700">{activeStores}</p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                  <p className="text-[11px] text-violet-700">Physical Stores</p>
                  <p className="text-xl font-semibold text-violet-700">{totalStores}</p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : stores.length === 0 ? (
                  <p className="text-sm text-gray-500">No stores added yet.</p>
                ) : (
                  stores.map((s, i) => {
                    const open = i === openIdx;
                    return (
                      <div
                        key={`${s.storeName || 'store'}-${i}`}
                        className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full px-4 py-3 flex items-center justify-between gap-3"
                          onClick={() => setOpenIdx(open ? -1 : i)}
                        >
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900">
                              {s.storeName || `Store ${i + 1}`}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {s.completeAddress || s.mapAddress || 'No address'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                s.isActive !== false
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-600'
                              }`}
                            >
                              {s.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span className="text-gray-500">{open ? '▴' : '▾'}</span>
                          </div>
                        </button>

                        {open ? (
                          <div className="px-4 pb-4">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500">Service Mode</p>
                                <div className="mt-2 space-y-1 text-sm text-gray-700">
                                  <p>
                                    <span className="font-medium">Local Delivery:</span>{' '}
                                    {s.serviceModeLocalDelivery ? 'Yes' : 'No'}
                                  </p>
                                  <p>
                                    <span className="font-medium">Pan-India Shipping:</span>{' '}
                                    {s.serviceModePanIndia ? 'Yes' : 'No'}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Walk-in Access</p>
                                <p className="mt-2 text-sm text-gray-700">
                                  {s.walkInAccessLabel || (s.allowsWalkIn ? 'Allowed' : 'No Public Access')}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => openEditStore(i)}
                                className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm hover:bg-blue-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-sm hover:bg-purple-100"
                              >
                                Manage Inventory
                              </button>
                              <button
                                type="button"
                                onClick={() => removeStore(i)}
                                className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm hover:bg-rose-100"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={slaAccepted}
                  onChange={(e) => setSlaAccepted(e.target.checked)}
                />
                SLA accepted
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={commissionAccepted}
                  onChange={(e) => setCommissionAccepted(e.target.checked)}
                />
                Commission accepted
              </label>
            </div>

            <button
              type="button"
              onClick={saveStoresToKyc}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? 'Updating Stores...' : 'Update Stores'}
            </button>
          </div>
        </main>
      </div>

      {isStoreModalOpen ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-4 space-y-4">
            <h3 className="text-lg font-semibold">
              {editingStoreIdx >= 0 ? 'Edit Store Settings' : 'Configure Store Settings'}
            </h3>
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-sm font-medium">Basic Information</p>
              <input
                value={draftStore.storeName}
                onChange={(e) =>
                  setDraftStore((p) => ({ ...p, storeName: e.target.value }))
                }
                placeholder="Store Name"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <textarea
                value={draftStore.completeAddress}
                onChange={(e) =>
                  setDraftStore((p) => ({ ...p, completeAddress: e.target.value }))
                }
                placeholder="Complete Address"
                className="w-full px-3 py-2 border rounded-lg text-sm min-h-20"
              />
              <input
                value={draftStore.pincode}
                onChange={(e) =>
                  setDraftStore((p) => ({ ...p, pincode: e.target.value }))
                }
                placeholder="Pincode"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <div className="border rounded-xl p-3 bg-slate-50">
                <p className="text-xs font-medium text-gray-700 mb-2">Pin Location on Map</p>
                <div className="border rounded-xl bg-white h-36 flex flex-col items-center justify-center text-center px-3">
                  <p className="text-sm text-gray-500">Interactive Map Widget</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMapQuery(draftStore.mapAddress || draftStore.completeAddress || '');
                      setMapResults([]);
                      setIsMapModalOpen(true);
                    }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
                  >
                    Open Map Selector
                  </button>
                </div>
                {draftStore.mapAddress ? (
                  <p className="text-[11px] text-gray-600 mt-2 truncate">
                    Selected: {draftStore.mapAddress}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Store Photos</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  For Verified Badge
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setDraftStore((p) => ({
                    ...p,
                    shopFrontPhotoName: f?.name || '',
                    shopFrontPhotoFile: f,
                  }));
                }}
                className="w-full text-sm"
              />
              {draftStore.shopFrontPhotoName ? (
                <p className="text-[11px] text-gray-600">
                  Front photo: {draftStore.shopFrontPhotoName}
                </p>
              ) : null}
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setDraftStore((p) => ({
                    ...p,
                    additionalPhotoNames: Array.from(e.target.files || []).map(
                      (f) => f.name,
                    ),
                  }))
                }
                className="w-full text-sm"
              />
              {draftStore.additionalPhotoNames?.length ? (
                <p className="text-[11px] text-gray-600">
                  Extra photos: {draftStore.additionalPhotoNames.length}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-sm font-medium">Delivery Zone</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="deliveryZoneType"
                  checked={draftStore.deliveryZoneType === 'pan-india'}
                  onChange={() =>
                    setDraftStore((p) => ({ ...p, deliveryZoneType: 'pan-india' }))
                  }
                />
                Pan-India (Standard Shipping)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="deliveryZoneType"
                  checked={draftStore.deliveryZoneType === 'hyper-local'}
                  onChange={() =>
                    setDraftStore((p) => ({ ...p, deliveryZoneType: 'hyper-local' }))
                  }
                />
                Hyper-local (Define Radius)
              </label>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Service Radius</span>
                  <span className="font-semibold text-purple-700">
                    {draftStore.serviceRadiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={draftStore.serviceRadiusKm}
                  onChange={(e) =>
                    setDraftStore((p) => ({
                      ...p,
                      serviceRadiusKm: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="mt-2 rounded-xl bg-purple-50 border border-purple-100 h-32 flex items-center justify-center text-xs text-purple-700 text-center px-3">
                  Coverage map preview
                  {draftStore.deliveryZoneType === 'hyper-local' ? (
                    <span className="ml-1">({draftStore.serviceRadiusKm} km radius)</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 p-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">Customer Walk-in</p>
              <div className="rounded-xl border border-emerald-100 p-3 space-y-2 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Allow Walk-in Customers?
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      If ON, this location will show up on the &quot;Find Store&quot; map
                      for users.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftStore((p) => {
                        const nextWalkIn = !p.allowsWalkIn;
                        return {
                          ...p,
                          allowsWalkIn: nextWalkIn,
                          walkInAccessLabel: nextWalkIn
                            ? 'Public Access'
                            : 'No Public Access',
                        };
                      })
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                      draftStore.allowsWalkIn ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                    aria-label="Toggle walk-in customers"
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        draftStore.allowsWalkIn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Store Timings</p>
                  <input
                    value={draftStore.storeTimings}
                    onChange={(e) =>
                      setDraftStore((p) => ({ ...p, storeTimings: e.target.value }))
                    }
                    placeholder="Mon-Sat, 10 AM - 9 PM"
                    disabled={!draftStore.allowsWalkIn}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draftStore.isDefault}
                  onChange={(e) =>
                    setDraftStore((p) => ({
                      ...p,
                      isDefault: e.target.checked,
                    }))
                  }
                />
                Mark as Default Store
              </label>
              <label className="flex items-center gap-2 text-sm justify-self-end">
                <input
                  type="checkbox"
                  checked={draftStore.isActive}
                  onChange={(e) =>
                    setDraftStore((p) => ({
                      ...p,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Active Store
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsStoreModalOpen(false);
                  setEditingStoreIdx(-1);
                  setDraftStore(emptyStore);
                }}
                className="px-4 py-2 rounded-lg border text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveStoreDraft}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
              >
                Save Store
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isMapModalOpen ? (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Select Store Location</h4>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={mapQuery}
                onChange={(e) => setMapQuery(e.target.value)}
                placeholder="Search place, address, landmark..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={searchMapLocations}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
              >
                {mapSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <iframe
                title="Map Preview"
                className="w-full h-64"
                src={
                  draftStore.mapLat && draftStore.mapLng
                    ? `https://www.openstreetmap.org/export/embed.html?bbox=${draftStore.mapLng - 0.02}%2C${draftStore.mapLat - 0.02}%2C${draftStore.mapLng + 0.02}%2C${draftStore.mapLat + 0.02}&layer=mapnik&marker=${draftStore.mapLat}%2C${draftStore.mapLng}`
                    : 'https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.8%2C73.2%2C19.2&layer=mapnik'
                }
              />
            </div>

            <div className="space-y-2">
              {mapResults.length === 0 ? (
                <p className="text-sm text-gray-500">Search and choose a location.</p>
              ) : (
                mapResults.map((place) => (
                  <button
                    type="button"
                    key={`${place.place_id}`}
                    onClick={() => selectMapLocation(place)}
                    className="w-full text-left p-3 rounded-xl border hover:border-blue-300 hover:bg-blue-50"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {place.display_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Lat: {Number(place.lat).toFixed(5)}, Lng:{' '}
                      {Number(place.lon).toFixed(5)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

