/** Store draft shape + validation (aligned with vendor KYC step 4). */

export const emptyStore = {
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
  additionalPhotoNames: [],
  additionalPhotoUrls: [],
  additionalPhotoFiles: [],
  deliveryZoneType: 'pan-india',
  serviceRadiusKm: 15,
  serviceModeLocalDelivery: true,
  serviceModePanIndia: false,
  walkInAccessLabel: 'No Public Access',
  isDefault: false,
  isActive: true,
  allowsWalkIn: false,
  storeTimings: '',
};

export const freshEmptyStore = () => ({
  ...emptyStore,
  additionalPhotoNames: [],
  additionalPhotoUrls: [],
  additionalPhotoFiles: [],
});

export const alignStoreAdditionalPhotoArrays = (store) => {
  const names = Array.isArray(store?.additionalPhotoNames)
    ? [...store.additionalPhotoNames]
    : [];
  const urls = Array.isArray(store?.additionalPhotoUrls)
    ? [...store.additionalPhotoUrls]
    : [];
  const rawFiles = Array.isArray(store?.additionalPhotoFiles)
    ? [...store.additionalPhotoFiles]
    : [];
  const L = Math.max(names.length, urls.length, rawFiles.length);
  while (names.length < L) names.push('');
  while (urls.length < L) urls.push('');
  while (rawFiles.length < L) rawFiles.push(null);
  for (let i = 0; i < L; i++) {
    if (!names[i] && urls[i]) {
      const seg = String(urls[i]).split('/').pop() || 'Photo';
      try {
        names[i] = decodeURIComponent(String(seg).split('?')[0] || 'Photo');
      } catch {
        names[i] = 'Photo';
      }
    }
  }
  return { names, urls, files: rawFiles };
};

export const storesJsonForPayload = (stores) =>
  JSON.stringify(
    (stores || []).map((s) => {
      const { shopFrontPhotoFile, additionalPhotoFiles, ...rest } = s;
      return rest;
    }),
  );

export const isShopFrontFileLike = (x) =>
  x instanceof File ||
  (Boolean(x) &&
    typeof x === 'object' &&
    typeof x.name === 'string' &&
    typeof x.size === 'number');

export const validateDraftStoreComplete = (d) => {
  if (!String(d?.storeName || '').trim()) {
    return { ok: false, message: 'Please enter the store name.' };
  }
  if (!String(d?.completeAddress || '').trim()) {
    return { ok: false, message: 'Please enter the complete address.' };
  }
  const pinDigits = String(d?.pincode || '').replace(/\D/g, '');
  if (pinDigits.length < 5 || pinDigits.length > 6) {
    return {
      ok: false,
      message: 'Please enter a valid postal code (5 or 6 digits).',
    };
  }
  const hasShopFront =
    isShopFrontFileLike(d.shopFrontPhotoFile) ||
    Boolean(String(d.shopFrontPhotoUrl || '').trim()) ||
    Boolean(String(d.shopFrontPhotoName || '').trim());
  if (!hasShopFront) {
    return {
      ok: false,
      message: 'Please upload the store front photo with signboard.',
    };
  }
  if (d.allowsWalkIn && !String(d.storeTimings || '').trim()) {
    return {
      ok: false,
      message:
        'Walk-in is on — please enter store timings, or turn off walk-in.',
    };
  }
  return { ok: true, message: '' };
};
