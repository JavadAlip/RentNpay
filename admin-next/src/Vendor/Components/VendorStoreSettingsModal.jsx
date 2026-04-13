import React, { useEffect, useMemo, useState } from 'react';
import { Store, X } from 'lucide-react';
import serviceModeHeadingIcon from '@/assets/icons/service-mode.png';
import shopHeadingIcon from '@/assets/icons/shop.png';
import walkInHeadingIcon from '@/assets/icons/walkin.png';
import { toast } from 'react-toastify';
import {
  alignStoreAdditionalPhotoArrays,
  validateDraftStoreComplete,
} from '../utils/vendorStoreDraft';

const iconSrc = (mod) =>
  typeof mod === 'string' ? mod : mod?.src || '';

export default function VendorStoreSettingsModal({
  open,
  draftStore,
  setDraftStore,
  onClose,
  onSave,
  editingStoreIdx,
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapQuery, setMapQuery] = useState('');
  const [mapResults, setMapResults] = useState([]);
  const [mapSearching, setMapSearching] = useState(false);
  const [shopHeadingIconFailed, setShopHeadingIconFailed] = useState(false);
  const [serviceModeHeadingIconFailed, setServiceModeHeadingIconFailed] =
    useState(false);
  const [walkInHeadingIconFailed, setWalkInHeadingIconFailed] = useState(false);

  const additionalPhotoBlobUrls = useMemo(() => {
    const files = Array.isArray(draftStore?.additionalPhotoFiles)
      ? draftStore.additionalPhotoFiles
      : [];
    return files.map((f) => (f instanceof File ? URL.createObjectURL(f) : ''));
  }, [draftStore?.additionalPhotoFiles]);

  useEffect(() => {
    return () => {
      additionalPhotoBlobUrls.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [additionalPhotoBlobUrls]);

  const searchMapLocations = async () => {
    const q = String(mapQuery || '').trim();
    if (!q) {
      setMapResults([]);
      return;
    }
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

  const handleSave = () => {
    const v = validateDraftStoreComplete(draftStore);
    if (!v.ok) {
      toast.error(v.message);
      return;
    }
    onSave?.();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
        <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Configure Store Settings
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Add store details, photos, delivery zone, and walk-in settings.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  {shopHeadingIconFailed ? (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Store className="h-5 w-5" strokeWidth={2} />
                    </span>
                  ) : (
                    <img
                      src={iconSrc(shopHeadingIcon)}
                      alt=""
                      className="h-9 w-9"
                      onError={() => setShopHeadingIconFailed(true)}
                    />
                  )}
                  <p className="text-base font-bold text-gray-900">
                    Basic Information
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={draftStore.storeName}
                      onChange={(e) =>
                        setDraftStore((p) => ({
                          ...p,
                          storeName: e.target.value,
                        }))
                      }
                      placeholder="e.g., Baner Branch"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      Complete Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={draftStore.completeAddress}
                      onChange={(e) =>
                        setDraftStore((p) => ({
                          ...p,
                          completeAddress: e.target.value,
                        }))
                      }
                      placeholder="Enter full address with landmarks"
                      className="mt-1 min-h-[88px] w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={draftStore.pincode}
                      onChange={(e) =>
                        setDraftStore((p) => ({
                          ...p,
                          pincode: e.target.value,
                        }))
                      }
                      placeholder="e.g., 411038"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">
                      Pin Location on Map
                    </p>
                    <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <iframe
                        title="Map Preview"
                        className="h-44 w-full"
                        src={
                          draftStore.mapLat && draftStore.mapLng
                            ? `https://www.openstreetmap.org/export/embed.html?bbox=${draftStore.mapLng - 0.02}%2C${draftStore.mapLat - 0.02}%2C${draftStore.mapLng + 0.02}%2C${draftStore.mapLat + 0.02}&layer=mapnik&marker=${draftStore.mapLat}%2C${draftStore.mapLng}`
                            : 'https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.8%2C73.2%2C19.2&layer=mapnik'
                        }
                      />
                    </div>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setMapQuery(
                            draftStore.mapAddress ||
                              draftStore.completeAddress ||
                              '',
                          );
                          setMapResults([]);
                          setIsMapModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Search &amp; Select Location
                      </button>
                      {draftStore.mapAddress ? (
                        <p className="text-xs text-gray-600 sm:flex-1 sm:truncate">
                          Selected: {draftStore.mapAddress}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-bold text-gray-900">
                    Store Photos
                  </p>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    For Verified Badge
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      Store Front (with Signboard){' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setDraftStore((p) => ({
                              ...p,
                              shopFrontPhotoName: f?.name || '',
                              shopFrontPhotoFile: f,
                            }));
                          }}
                        />
                      </label>
                      <div className="flex-1 text-xs text-gray-600">
                        {draftStore.shopFrontPhotoName ? (
                          <span className="font-medium text-gray-900">
                            {draftStore.shopFrontPhotoName}
                          </span>
                        ) : (
                          <span>No file chosen</span>
                        )}
                      </div>
                    </div>
                    {draftStore.shopFrontPhotoUrl &&
                    !draftStore.shopFrontPhotoFile ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                        <img
                          src={draftStore.shopFrontPhotoUrl}
                          alt="Store front"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">
                      Additional Photos (optional)
                    </label>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                        Upload Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const picked = Array.from(e.target.files || []);
                            setDraftStore((p) => {
                              const aligned = alignStoreAdditionalPhotoArrays(p);
                              const nextNames = [...aligned.names];
                              const nextUrls = [...aligned.urls];
                              const nextFiles = [...aligned.files];
                              picked.forEach((file) => {
                                nextNames.push(file.name || 'Photo');
                                nextUrls.push('');
                                nextFiles.push(file);
                              });
                              return {
                                ...p,
                                additionalPhotoNames: nextNames,
                                additionalPhotoUrls: nextUrls,
                                additionalPhotoFiles: nextFiles,
                              };
                            });
                          }}
                        />
                      </label>
                      <p className="text-xs text-gray-600">
                        {draftStore.additionalPhotoNames?.length
                          ? `${draftStore.additionalPhotoNames.length} file(s) selected`
                          : 'No files chosen'}
                      </p>
                    </div>
                    {draftStore.additionalPhotoNames?.length ? (
                      <div className="mt-3 space-y-2">
                        {draftStore.additionalPhotoNames.map((name, idx) => {
                          const blobUrl = additionalPhotoBlobUrls[idx] || '';
                          const remoteUrl =
                            draftStore.additionalPhotoUrls?.[idx] || '';
                          const preview = blobUrl || remoteUrl;
                          return (
                            <div
                              key={`extra-${idx}`}
                              className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {name || `Photo ${idx + 1}`}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  Additional store photo
                                </p>
                              </div>
                              {preview ? (
                                <div className="h-16 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                  <img
                                    src={preview}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : null}
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftStore((p) => {
                                    const aligned =
                                      alignStoreAdditionalPhotoArrays(p);
                                    const nextNames = [...aligned.names];
                                    const nextUrls = [...aligned.urls];
                                    const nextFiles = [...aligned.files];
                                    nextNames.splice(idx, 1);
                                    nextUrls.splice(idx, 1);
                                    nextFiles.splice(idx, 1);
                                    return {
                                      ...p,
                                      additionalPhotoNames: nextNames,
                                      additionalPhotoUrls: nextUrls,
                                      additionalPhotoFiles: nextFiles,
                                    };
                                  })
                                }
                                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  {serviceModeHeadingIconFailed ? (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Store className="h-5 w-5" strokeWidth={2} />
                    </span>
                  ) : (
                    <img
                      src={iconSrc(serviceModeHeadingIcon)}
                      alt=""
                      className="h-9 w-9"
                      onError={() => setServiceModeHeadingIconFailed(true)}
                    />
                  )}
                  <p className="text-base font-bold text-gray-900">
                    Delivery Zone
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryZoneType"
                      checked={draftStore.deliveryZoneType === 'pan-india'}
                      onChange={() =>
                        setDraftStore((p) => ({
                          ...p,
                          deliveryZoneType: 'pan-india',
                          serviceModePanIndia: true,
                          serviceModeLocalDelivery: false,
                        }))
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Pan-India (Standard Shipping)
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        Nationwide coverage via courier partners.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryZoneType"
                      checked={draftStore.deliveryZoneType === 'hyper-local'}
                      onChange={() =>
                        setDraftStore((p) => ({
                          ...p,
                          deliveryZoneType: 'hyper-local',
                          serviceModePanIndia: false,
                          serviceModeLocalDelivery: true,
                        }))
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Hyper-local (Define Radius)
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        Local deliveries within a service radius.
                      </span>
                    </span>
                  </label>
                  <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">
                        Service Radius
                      </span>
                      <span className="text-sm font-bold text-purple-700">
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
                      className="mt-2 w-full"
                    />
                    <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-dashed border-purple-200 bg-white text-center text-xs text-purple-700">
                      Coverage map preview
                      {draftStore.deliveryZoneType === 'hyper-local' ? (
                        <span className="ml-1">
                          ({draftStore.serviceRadiusKm} km radius)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  {walkInHeadingIconFailed ? (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Store className="h-5 w-5" strokeWidth={2} />
                    </span>
                  ) : (
                    <img
                      src={iconSrc(walkInHeadingIcon)}
                      alt=""
                      className="h-9 w-9"
                      onError={() => setWalkInHeadingIconFailed(true)}
                    />
                  )}
                  <p className="text-base font-bold text-gray-900">
                    Customer Walk-in
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Allow Walk-in Customers?
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        If ON, this location will show up on the &quot;Find
                        Store&quot; map for users.
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
                      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                        draftStore.allowsWalkIn ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                      aria-label="Toggle walk-in customers"
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                          draftStore.allowsWalkIn
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-gray-700">
                      Store Timings
                    </label>
                    <input
                      value={draftStore.storeTimings}
                      onChange={(e) =>
                        setDraftStore((p) => ({
                          ...p,
                          storeTimings: e.target.value,
                        }))
                      }
                      placeholder="Mon-Sat, 10 AM - 9 PM"
                      disabled={!draftStore.allowsWalkIn}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <p className="mb-3 text-base font-bold text-gray-900">
                  Store Defaults
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <input
                      type="checkbox"
                      checked={draftStore.isDefault}
                      onChange={(e) =>
                        setDraftStore((p) => ({
                          ...p,
                          isDefault: e.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Mark as Default Store
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        Used as the primary store for new orders.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <input
                      type="checkbox"
                      checked={draftStore.isActive}
                      onChange={(e) =>
                        setDraftStore((p) => ({
                          ...p,
                          isActive: e.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Active Store
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        Inactive stores are hidden from customers.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editingStoreIdx >= 0 ? 'Update Store' : 'Save Store'}
            </button>
          </div>
        </div>
      </div>

      {isMapModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-gray-900">
                Select Store Location
              </h4>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="rounded-full px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={mapQuery}
                onChange={(e) => setMapQuery(e.target.value)}
                placeholder="Search place, address, landmark..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
              />
              <button
                type="button"
                onClick={searchMapLocations}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {mapSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
              <iframe
                title="Map Preview"
                className="h-64 w-full"
                src={
                  draftStore.mapLat && draftStore.mapLng
                    ? `https://www.openstreetmap.org/export/embed.html?bbox=${draftStore.mapLng - 0.02}%2C${draftStore.mapLat - 0.02}%2C${draftStore.mapLng + 0.02}%2C${draftStore.mapLat + 0.02}&layer=mapnik&marker=${draftStore.mapLat}%2C${draftStore.mapLng}`
                    : 'https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C18.8%2C73.2%2C19.2&layer=mapnik'
                }
              />
            </div>
            <div className="mt-3 space-y-2">
              {mapResults.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Search and choose a location.
                </p>
              ) : (
                mapResults.map((place) => (
                  <button
                    type="button"
                    key={`${place.place_id}`}
                    onClick={() => selectMapLocation(place)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50"
                  >
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {place.display_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
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
    </>
  );
}
