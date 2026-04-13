'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Home,
  MapPin,
  Package,
  Pencil,
  Shield,
  Store,
  Trash2,
} from 'lucide-react';
import serviceModeHeadingIcon from '@/assets/icons/service-mode.png';
import shopHeadingIcon from '@/assets/icons/shop.png';
import termsHeadingIcon from '@/assets/icons/terms.png';
import walkInHeadingIcon from '@/assets/icons/walkin.png';
import { apiGetMyVendorKyc, apiSubmitVendorKyc } from '@/service/api';
import VendorStoreSettingsModal from '../../Components/VendorStoreSettingsModal';
import VendorSidebar from '../../Components/Common/VendorSidebar';
import VendorTopBar from '../../Components/Common/VendorTopBar';
import {
  alignStoreAdditionalPhotoArrays,
  freshEmptyStore,
  storesJsonForPayload,
} from '../../utils/vendorStoreDraft';

const iconSrc = (mod) => (typeof mod === 'string' ? mod : mod?.src || '');

export default function VendorStoresPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [stores, setStores] = useState([]);
  const [slaAccepted, setSlaAccepted] = useState(false);
  const [commissionAccepted, setCommissionAccepted] = useState(false);
  const [expandedStoreIdx, setExpandedStoreIdx] = useState(null);
  const [storeDeleteConfirmIdx, setStoreDeleteConfirmIdx] = useState(null);

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [draftStore, setDraftStore] = useState(() => freshEmptyStore());
  const [editingStoreIdx, setEditingStoreIdx] = useState(-1);

  const [storeShopIconFailed, setStoreShopIconFailed] = useState(false);
  const [storeServiceModeIconFailed, setStoreServiceModeIconFailed] =
    useState(false);
  const [storeWalkinIconFailed, setStoreWalkinIconFailed] = useState(false);
  const [storeTermsIconFailed, setStoreTermsIconFailed] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null;
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
        setExpandedStoreIdx(list.length ? 0 : null);
        setSlaAccepted(Boolean(kyc?.storeManagement?.slaAccepted));
        setCommissionAccepted(
          Boolean(kyc?.storeManagement?.commissionAccepted),
        );
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
  const physicalStores = useMemo(
    () => stores.filter((s) => s.allowsWalkIn).length,
    [stores],
  );

  const closeStoreModal = () => {
    setIsStoreModalOpen(false);
    setEditingStoreIdx(-1);
    setDraftStore(freshEmptyStore());
  };

  const openAddStore = () => {
    setEditingStoreIdx(-1);
    setDraftStore({
      ...freshEmptyStore(),
      isDefault: stores.length === 0,
    });
    setIsStoreModalOpen(true);
  };

  const openEditStore = (idx) => {
    setEditingStoreIdx(idx);
    const s = stores[idx] || {};
    const aligned = alignStoreAdditionalPhotoArrays(s);
    setDraftStore({
      ...freshEmptyStore(),
      ...s,
      additionalPhotoNames: aligned.names,
      additionalPhotoUrls: aligned.urls,
      additionalPhotoFiles: aligned.files,
    });
    setIsStoreModalOpen(true);
  };

  const saveStoreDraft = () => {
    setStores((prev) => {
      const toSave = { ...draftStore };
      let next = [...prev];
      if (toSave.isDefault) {
        next = next.map((s) => ({ ...s, isDefault: false }));
      }
      if (editingStoreIdx >= 0) {
        next[editingStoreIdx] = toSave;
      } else {
        next.push(toSave);
      }
      return next;
    });
    closeStoreModal();
  };

  const confirmRemoveStore = () => {
    if (storeDeleteConfirmIdx == null) return;
    const idx = storeDeleteConfirmIdx;
    setStores((prev) => prev.filter((_, i) => i !== idx));
    setExpandedStoreIdx((cur) => {
      if (cur === idx) return null;
      if (cur != null && cur > idx) return cur - 1;
      return cur;
    });
    setStoreDeleteConfirmIdx(null);
  };

  const saveStoresToKyc = async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null;
    if (!token) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = new FormData();
      payload.append('step', '4');
      payload.append('finalSubmit', 'false');
      payload.append('stores', storesJsonForPayload(stores));
      payload.append('slaAccepted', slaAccepted ? 'true' : 'false');
      payload.append(
        'commissionAccepted',
        commissionAccepted ? 'true' : 'false',
      );

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

  const renderStoreShopPngIcon = () =>
    storeShopIconFailed ? (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-600"
        aria-hidden
      >
        <Store className="h-5 w-5 text-white" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={iconSrc(shopHeadingIcon)}
        alt=""
        width={36}
        height={36}
        loading="lazy"
        decoding="async"
        className="h-9 w-9 shrink-0 rounded-xl object-cover"
        onError={() => setStoreShopIconFailed(true)}
      />
    );

  const renderStoreServiceModePngIcon = () =>
    storeServiceModeIconFailed ? (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center"
        aria-hidden
      >
        <FileText className="h-4 w-4 text-slate-600" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={iconSrc(serviceModeHeadingIcon)}
        alt=""
        width={20}
        height={20}
        loading="lazy"
        decoding="async"
        className="h-5 w-5 shrink-0 object-contain"
        onError={() => setStoreServiceModeIconFailed(true)}
      />
    );

  const renderStoreWalkinPngIcon = () =>
    storeWalkinIconFailed ? (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center"
        aria-hidden
      >
        <Home className="h-4 w-4 text-slate-600" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={iconSrc(walkInHeadingIcon)}
        alt=""
        width={20}
        height={20}
        loading="lazy"
        decoding="async"
        className="h-5 w-5 shrink-0 object-contain"
        onError={() => setStoreWalkinIconFailed(true)}
      />
    );

  const renderTermsCommissionPngIcon = () =>
    storeTermsIconFailed ? (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50"
        aria-hidden
      >
        <Shield className="h-4 w-4 text-rose-500" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={iconSrc(termsHeadingIcon)}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        decoding="async"
        className="h-8 w-8 shrink-0 object-contain"
        onError={() => setStoreTermsIconFailed(true)}
      />
    );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <VendorSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <VendorTopBar />
        <main className="flex-1 overflow-y-auto bg-[#f3f5f9] p-4 sm:p-6">
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 shadow-sm ring-1 ring-violet-500/30"
                aria-hidden
              >
                <Store className="h-6 w-6 text-white" strokeWidth={1.75} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                My Active Stores
              </h1>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <section className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Manage Stores
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Configure your physical outlets and delivery zones.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddStore}
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    + Add New Store
                  </button>
                </div>
                <div className="border-t border-gray-100" />
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5">
                  <div className="rounded-xl border border-blue-200/80 bg-blue-50 p-4">
                    <p className="text-[11px] font-medium text-gray-500">
                      Total Stores
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {totalStores}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-4">
                    <p className="text-[11px] font-medium text-gray-500">
                      Active Stores
                    </p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                      {activeStores}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-200/80 bg-purple-50 p-4">
                    <p className="text-[11px] font-medium text-gray-500">
                      Physical Stores
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {physicalStores}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                  </div>
                ) : stores.length === 0 ? (
                  <p className="text-sm text-gray-500">No stores added yet.</p>
                ) : (
                  stores.map((s, i) => {
                    const isExpanded = expandedStoreIdx === i;
                    const walkInNoPublic =
                      !s.allowsWalkIn ||
                      String(s.walkInAccessLabel || '')
                        .toLowerCase()
                        .includes('no public');
                    return (
                      <div
                        key={`store-${i}-${s.storeName || 'unnamed'}`}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedStoreIdx((cur) => (cur === i ? null : i))
                          }
                          className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-gray-50/80"
                        >
                          {renderStoreShopPngIcon()}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {s.storeName || `Store ${i + 1}`}
                              </span>
                              {s.isDefault ? (
                                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                  DEFAULT
                                </span>
                              ) : null}
                              {s.isActive !== false ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                  <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                                    aria-hidden
                                  />
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                                  <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"
                                    aria-hidden
                                  />
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-gray-500">
                              <MapPin
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400"
                                strokeWidth={2}
                                aria-hidden
                              />
                              <span>{s.completeAddress || '—'}</span>
                            </p>
                          </div>
                          <span className="shrink-0 text-gray-400" aria-hidden>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" strokeWidth={2} />
                            ) : (
                              <ChevronDown
                                className="h-5 w-5"
                                strokeWidth={2}
                              />
                            )}
                          </span>
                        </button>
                        {isExpanded ? (
                          <div className="space-y-4 border-t border-gray-100 px-4 pb-4 pt-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Configuration:
                            </p>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-start">
                              <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                                <div className="mb-3 flex items-center gap-2">
                                  {renderStoreServiceModePngIcon()}
                                  <p className="text-sm font-bold text-gray-900">
                                    Service Mode:
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div
                                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 ${
                                      s.serviceModePanIndia
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white'
                                    }`}
                                  >
                                    <span
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                        s.serviceModePanIndia
                                          ? 'border-blue-600 bg-blue-600 text-white'
                                          : 'border-gray-300 bg-white'
                                      }`}
                                      aria-hidden
                                    >
                                      {s.serviceModePanIndia ? (
                                        <Check
                                          className="h-3.5 w-3.5"
                                          strokeWidth={3}
                                        />
                                      ) : null}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                      Pan-India Shipping
                                    </span>
                                  </div>
                                  <div
                                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 ${
                                      s.serviceModeLocalDelivery
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white'
                                    }`}
                                  >
                                    <span
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                        s.serviceModeLocalDelivery
                                          ? 'border-blue-600 bg-blue-600 text-white'
                                          : 'border-gray-300 bg-white'
                                      }`}
                                      aria-hidden
                                    >
                                      {s.serviceModeLocalDelivery ? (
                                        <Check
                                          className="h-3.5 w-3.5"
                                          strokeWidth={3}
                                        />
                                      ) : null}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                      Local Delivery
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                                <div className="mb-3 flex items-center gap-2">
                                  {renderStoreWalkinPngIcon()}
                                  <p className="text-sm font-bold text-gray-900">
                                    Walk-in Access:
                                  </p>
                                </div>
                                <div
                                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 ${
                                    walkInNoPublic
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                      walkInNoPublic
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-gray-300 bg-white'
                                    }`}
                                    aria-hidden
                                  >
                                    {walkInNoPublic ? (
                                      <Check
                                        className="h-3.5 w-3.5"
                                        strokeWidth={3}
                                      />
                                    ) : null}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {walkInNoPublic
                                      ? 'No Public Access'
                                      : s.walkInAccessLabel || 'Public Access'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-stretch">
                              <button
                                type="button"
                                onClick={() => openEditStore(i)}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 sm:px-5"
                              >
                                <Pencil className="h-4 w-4" strokeWidth={2} />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-purple-300 bg-purple-100 px-4 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-200/80"
                              >
                                <Package className="h-4 w-4" strokeWidth={2} />
                                Manage Inventory
                              </button>
                              <button
                                type="button"
                                onClick={() => setStoreDeleteConfirmIdx(i)}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 sm:px-5"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={2} />
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

              {/* <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-4 sm:p-5">
                <div className="mb-1 flex items-start gap-2.5">
                  {renderTermsCommissionPngIcon()}
                  <div>
                    <p className="text-base font-bold text-gray-900">
                      Terms &amp; Commission
                    </p>
                    <p className="text-xs text-gray-500">
                      Review and accept our partner agreement
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-white/90 p-3 sm:p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-gray-800">
                    <input
                      type="checkbox"
                      checked={slaAccepted}
                      onChange={(e) => setSlaAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                    />
                    <span>
                      I agree to the Rentnpay{' '}
                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        Service Level Agreement (SLA)
                        <ExternalLink
                          className="h-3.5 w-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </button>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-gray-800">
                    <input
                      type="checkbox"
                      checked={commissionAccepted}
                      onChange={(e) => setCommissionAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                    />
                    <span>
                      I accept the{' '}
                      <strong className="font-semibold text-gray-900">
                        Platform Commission
                      </strong>{' '}
                      on all rentals.{' '}
                      <button
                        type="button"
                        className="font-medium text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        Read Commission Policy
                      </button>
                    </span>
                  </label>
                </div>
              </div> */}
            </section>

            <button
              type="button"
              onClick={saveStoresToKyc}
              disabled={saving}
              className="w-full rounded-xl bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? 'Updating Stores...' : 'Update Stores'}
            </button>
          </div>
        </main>
      </div>

      <VendorStoreSettingsModal
        open={isStoreModalOpen}
        draftStore={draftStore}
        setDraftStore={setDraftStore}
        onClose={closeStoreModal}
        onSave={saveStoreDraft}
        editingStoreIdx={editingStoreIdx}
      />

      {storeDeleteConfirmIdx != null ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete store?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This removes the store from your list. You can add it again later
              from &quot;Add New Store&quot;.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStoreDeleteConfirmIdx(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveStore}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
