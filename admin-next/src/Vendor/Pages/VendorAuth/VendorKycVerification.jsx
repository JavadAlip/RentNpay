'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CreditCard,
  ExternalLink,
  FileText,
  Gift,
  Globe,
  Home,
  Info,
  Landmark,
  MapPin,
  MapPinned,
  Package,
  Pencil,
  Phone,
  Shield,
  Store,
  Trash2,
  Truck,
  Upload,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import basicInfoModalIcon from '@/assets/icons/basic-info.png';
import bankAccountDetailsIcon from '@/assets/icons/bank-account-details.png';
import businessInfoIcon from '@/assets/icons/business-info.png';
import businessVerificationIcon from '@/assets/icons/business-verification.png';
import ownerPhotoIcon from '@/assets/icons/owner-photo.png';
import personalInfoIcon from '@/assets/icons/personal-info.png';
import welcomeKitIcon from '@/assets/icons/welcome-kit.png';
import step1Icon from '@/assets/icons/step1.png';
import secureFooterIcon from '@/assets/icons/secure.png';
import saveStoreIcon from '@/assets/icons/save-store.png';
import step2Icon from '@/assets/icons/step2.png';
import serviceModeHeadingIcon from '@/assets/icons/service-mode.png';
import shopHeadingIcon from '@/assets/icons/shop.png';
import supportContactIcon from '@/assets/icons/support-contact.png';
import termsHeadingIcon from '@/assets/icons/terms.png';
import walkInHeadingIcon from '@/assets/icons/walkin.png';
import customerWalkModalIcon from '@/assets/icons/customer-walk.png';
import deliveryZoneModalIcon from '@/assets/icons/delivery-zone.png';
import mapModalIcon from '@/assets/icons/map.png';
import storePhotoModalIcon from '@/assets/icons/store-photo.png';
import { toast } from 'react-toastify';
import { apiGetMyVendorKyc, apiSubmitVendorKyc } from '@/service/api';

const defaultForm = {
  fullName: '',
  dateOfBirth: '',
  permanentAddress: '',
  contactNumber: '',
  panNumber: '',
  aadhaarNumber: '',
  tshirtSize: '',
  jeansWaistSize: '',
  shoeSize: '',
  ownerPhoto: null,
  panPhoto: null,
  aadhaarFront: null,
  aadhaarBack: null,
  shopName: '',
  businessCategory: '',
  shopActNumber: '',
  gstin: '',
  primaryContactNumber: '',
  secondaryContactNumber: '',
  shopActLicense: null,
  gstCertificate: null,
  accountHolderName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscCode: '',
  cancelledCheque: null,
  stores: [],
  slaAccepted: false,
  commissionAccepted: false,
};

const KYC_STEPPER_STEPS = [
  { step: 1, label: 'Proprietor Information' },
  { step: 2, label: 'Business Details' },
  { step: 3, label: 'Banking Details' },
  { step: 4, label: 'Store Management' },
];

const BUSINESS_CATEGORY_OPTIONS = [
  'Electronics',
  'Fashion & Clothing',
  'Home & Furniture',
  'Vehicles',
  'Real Estate',
  'Sports & Fitness',
  'Books & Education',
  'Beauty & Personal Care',
  'Toys & Baby Products',
  'Tools & Machinery',
];

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

/** Avoid mutating shared `emptyStore` array refs when resetting the modal draft. */
const freshEmptyStore = () => ({
  ...emptyStore,
  additionalPhotoNames: [],
  additionalPhotoUrls: [],
  additionalPhotoFiles: [],
});

const alignStoreAdditionalPhotoArrays = (store) => {
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

const storesJsonForPayload = (stores) =>
  JSON.stringify(
    (stores || []).map((s) => {
      const { shopFrontPhotoFile, additionalPhotoFiles, ...rest } = s;
      return rest;
    }),
  );

const isShopFrontFileLike = (x) =>
  x instanceof File ||
  (Boolean(x) &&
    typeof x === 'object' &&
    typeof x.name === 'string' &&
    typeof x.size === 'number');

/** All required Configure Store Settings fields before Save Store is allowed. */
const validateDraftStoreComplete = (d) => {
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

export default function VendorKycVerification() {
  const [form, setForm] = useState(defaultForm);
  const [filePreviews, setFilePreviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** Which primary action is running — drives per-button labels while saving */
  const [savingKind, setSavingKind] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [step, setStep] = useState(1);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [draftStore, setDraftStore] = useState(() => freshEmptyStore());
  const [editingStoreIdx, setEditingStoreIdx] = useState(-1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  /** Index of store pending removal — `null` when confirm modal is closed */
  const [storeDeleteConfirmIdx, setStoreDeleteConfirmIdx] = useState(null);
  const [mapQuery, setMapQuery] = useState('');
  const [mapResults, setMapResults] = useState([]);
  const [mapSearching, setMapSearching] = useState(false);
  const [personalInfoIconFailed, setPersonalInfoIconFailed] = useState(false);
  const [welcomeKitIconFailed, setWelcomeKitIconFailed] = useState(false);
  const [businessInfoIconFailed, setBusinessInfoIconFailed] = useState(false);
  const [businessVerificationIconFailed, setBusinessVerificationIconFailed] =
    useState(false);
  const [supportContactIconFailed, setSupportContactIconFailed] =
    useState(false);
  const [bankAccountHeaderIconFailed, setBankAccountHeaderIconFailed] =
    useState(false);
  const [secureFooterIconFailed, setSecureFooterIconFailed] = useState(false);
  const [expandedStoreIdx, setExpandedStoreIdx] = useState(0);
  const [storeShopIconFailed, setStoreShopIconFailed] = useState(false);
  const [storeServiceModeIconFailed, setStoreServiceModeIconFailed] =
    useState(false);
  const [storeWalkinIconFailed, setStoreWalkinIconFailed] = useState(false);
  const [storeTermsIconFailed, setStoreTermsIconFailed] = useState(false);
  const [storeCfgBasicPngFailed, setStoreCfgBasicPngFailed] = useState(false);
  const [storeCfgMapPngFailed, setStoreCfgMapPngFailed] = useState(false);
  const [storeCfgStorePhotoPngFailed, setStoreCfgStorePhotoPngFailed] =
    useState(false);
  const [storeCfgVerifiedShieldPngFailed, setStoreCfgVerifiedShieldPngFailed] =
    useState(false);
  const [storeCfgDeliveryPngFailed, setStoreCfgDeliveryPngFailed] =
    useState(false);
  const [storeCfgWalkPngFailed, setStoreCfgWalkPngFailed] = useState(false);
  /** URLs/paths already saved for step 1 uploads (so we do not require re-upload). */
  const [persistedProprietorDocs, setPersistedProprietorDocs] = useState({
    ownerPhoto: '',
    panPhoto: '',
    aadhaarFront: '',
    aadhaarBack: '',
  });
  const [persistedBusinessDocs, setPersistedBusinessDocs] = useState({
    shopActLicense: '',
    gstCertificate: '',
    shopActLicenseFileName: '',
    gstCertificateFileName: '',
  });
  const [persistedBankDocs, setPersistedBankDocs] = useState({
    cancelledCheque: '',
  });

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

    apiGetMyVendorKyc(token)
      .then((res) => {
        const kyc = res.data?.kyc;
        if (!kyc) return;
        setStatus(kyc.status || '');
        setStep(Number(kyc.currentStep || 1));
        setPersistedProprietorDocs({
          ownerPhoto: kyc.ownerPhoto || '',
          panPhoto: kyc.panPhoto || '',
          aadhaarFront: kyc.aadhaarFront || '',
          aadhaarBack: kyc.aadhaarBack || '',
        });
        setPersistedBusinessDocs({
          shopActLicense: kyc.businessDetails?.shopActLicense || '',
          gstCertificate: kyc.businessDetails?.gstCertificate || '',
          shopActLicenseFileName:
            kyc.businessDetails?.shopActLicenseFileName || '',
          gstCertificateFileName:
            kyc.businessDetails?.gstCertificateFileName || '',
        });
        setPersistedBankDocs({
          cancelledCheque: kyc.bankDetails?.cancelledCheque || '',
        });
        setForm((prev) => ({
          ...prev,
          fullName: kyc.fullName || '',
          dateOfBirth: kyc.dateOfBirth
            ? new Date(kyc.dateOfBirth).toISOString().slice(0, 10)
            : '',
          permanentAddress: kyc.permanentAddress || '',
          contactNumber: kyc.contactNumber || '',
          panNumber: kyc.panNumber || '',
          aadhaarNumber: kyc.aadhaarNumber || '',
          tshirtSize: kyc.tshirtSize || '',
          jeansWaistSize: kyc.jeansWaistSize || '',
          shoeSize: kyc.shoeSize || '',
          shopName: kyc.businessDetails?.shopName || '',
          businessCategory: kyc.businessDetails?.businessCategory || '',
          shopActNumber: kyc.businessDetails?.shopActNumber || '',
          gstin: kyc.businessDetails?.gstin || '',
          primaryContactNumber: kyc.businessDetails?.primaryContactNumber || '',
          secondaryContactNumber:
            kyc.businessDetails?.secondaryContactNumber || '',
          accountHolderName: kyc.bankDetails?.accountHolderName || '',
          accountNumber: kyc.bankDetails?.accountNumber || '',
          confirmAccountNumber: kyc.bankDetails?.confirmAccountNumber || '',
          ifscCode: kyc.bankDetails?.ifscCode || '',
          stores: Array.isArray(kyc.storeManagement?.stores)
            ? kyc.storeManagement.stores
            : [],
          slaAccepted: Boolean(kyc.storeManagement?.slaAccepted),
          commissionAccepted: Boolean(kyc.storeManagement?.commissionAccepted),
        }));
      })
      .catch((err) => {
        setError(err.response?.data?.message || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const additionalPhotoBlobUrls = useMemo(
    () =>
      (draftStore.additionalPhotoFiles || []).map((f) =>
        f instanceof File ? URL.createObjectURL(f) : '',
      ),
    [draftStore.additionalPhotoFiles],
  );

  useEffect(() => {
    return () => {
      additionalPhotoBlobUrls.forEach((u) => {
        if (u && String(u).startsWith('blob:')) URL.revokeObjectURL(u);
      });
    };
  }, [additionalPhotoBlobUrls]);

  const storeModalSaveCheck = validateDraftStoreComplete(draftStore);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const f = files[0] || null;
      setForm((prev) => ({ ...prev, [name]: f }));
      if (f) {
        const ext = String(f.name || '').toLowerCase();
        const extLooksImage =
          /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(ext);
        const isImage =
          String(f.type || '').startsWith('image/') ||
          (String(f.type || '') === '' && extLooksImage);
        const skipPreviewUrl = [
          'panPhoto',
          'aadhaarFront',
          'aadhaarBack',
          'shopActLicense',
          'gstCertificate',
          'cancelledCheque',
        ].includes(name);
        const objectUrl =
          !skipPreviewUrl && isImage ? URL.createObjectURL(f) : '';
        setFilePreviews((prev) => {
          const oldUrl = prev[name]?.url;
          if (oldUrl && String(oldUrl).startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
          }
          return {
            ...prev,
            [name]: {
              name: f.name,
              type: f.type || '',
              url: objectUrl,
              isImage: skipPreviewUrl ? false : isImage,
            },
          };
        });
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const renderFilePreview = (fieldName) => {
    const fileMeta = filePreviews[fieldName];
    if (!fileMeta) return null;
    return (
      <div className="mt-2 rounded-lg border border-gray-200 bg-white p-2">
        <p className="text-[11px] text-gray-600 truncate">{fileMeta.name}</p>
        {fileMeta.isImage && fileMeta.url ? (
          <img
            src={fileMeta.url}
            alt={fileMeta.name || 'Selected file'}
            className="mt-2 h-20 w-full object-cover rounded-md border border-gray-200"
          />
        ) : (
          <p className="text-[11px] text-gray-500 mt-1">
            Preview not available for this file type.
          </p>
        )}
      </div>
    );
  };

  const saveStep = async ({
    targetStep,
    finalSubmit = false,
    exitAfter = false,
  }) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('vendorToken')
        : null;
    if (!token) return;
    const kind = finalSubmit ? 'submit' : exitAfter ? 'exit' : 'continue';
    setSaving(true);
    setSavingKind(kind);
    setError('');
    try {
      const payload = new FormData();
      payload.append('step', String(targetStep ?? step));
      payload.append('finalSubmit', finalSubmit ? 'true' : 'false');
      payload.append('fullName', form.fullName);
      payload.append('dateOfBirth', form.dateOfBirth);
      payload.append('permanentAddress', form.permanentAddress);
      payload.append('contactNumber', form.contactNumber);
      payload.append('panNumber', form.panNumber);
      payload.append('aadhaarNumber', form.aadhaarNumber);
      payload.append('tshirtSize', form.tshirtSize);
      payload.append('jeansWaistSize', form.jeansWaistSize);
      payload.append('shoeSize', form.shoeSize);
      payload.append('shopName', form.shopName);
      payload.append('businessCategory', form.businessCategory);
      payload.append('shopActNumber', form.shopActNumber);
      payload.append('gstin', form.gstin);
      payload.append('primaryContactNumber', form.primaryContactNumber);
      payload.append('secondaryContactNumber', form.secondaryContactNumber);
      payload.append('accountHolderName', form.accountHolderName);
      payload.append('accountNumber', form.accountNumber);
      payload.append('confirmAccountNumber', form.confirmAccountNumber);
      payload.append('ifscCode', form.ifscCode);
      payload.append('stores', storesJsonForPayload(form.stores || []));
      payload.append('slaAccepted', form.slaAccepted ? 'true' : 'false');
      payload.append(
        'commissionAccepted',
        form.commissionAccepted ? 'true' : 'false',
      );
      if (form.ownerPhoto) payload.append('ownerPhoto', form.ownerPhoto);
      if (form.panPhoto) payload.append('panPhoto', form.panPhoto);
      if (form.aadhaarFront) payload.append('aadhaarFront', form.aadhaarFront);
      if (form.aadhaarBack) payload.append('aadhaarBack', form.aadhaarBack);
      if (form.shopActLicense instanceof File) {
        payload.append('shopActLicense', form.shopActLicense);
        payload.append('shopActLicenseFileName', form.shopActLicense.name);
      }
      if (form.gstCertificate instanceof File) {
        payload.append('gstCertificate', form.gstCertificate);
        payload.append('gstCertificateFileName', form.gstCertificate.name);
      }
      if (form.cancelledCheque)
        payload.append('cancelledCheque', form.cancelledCheque);

      // Upload store front photos as separate multipart fields.
      // Backend expects keys like: storeFront_0, storeFront_1, ...
      (form.stores || []).forEach((s, i) => {
        if (s.shopFrontPhotoFile instanceof File) {
          payload.append(`storeFront_${i}`, s.shopFrontPhotoFile);
        }
      });

      const res = await apiSubmitVendorKyc(payload, token);
      const savedKyc = res.data?.kyc;
      if (savedKyc) {
        setPersistedProprietorDocs({
          ownerPhoto: savedKyc.ownerPhoto || '',
          panPhoto: savedKyc.panPhoto || '',
          aadhaarFront: savedKyc.aadhaarFront || '',
          aadhaarBack: savedKyc.aadhaarBack || '',
        });
        setPersistedBusinessDocs({
          shopActLicense: savedKyc.businessDetails?.shopActLicense || '',
          gstCertificate: savedKyc.businessDetails?.gstCertificate || '',
          shopActLicenseFileName:
            savedKyc.businessDetails?.shopActLicenseFileName || '',
          gstCertificateFileName:
            savedKyc.businessDetails?.gstCertificateFileName || '',
        });
        setPersistedBankDocs({
          cancelledCheque: savedKyc.bankDetails?.cancelledCheque || '',
        });
        setFilePreviews((prev) => {
          const next = { ...prev };
          for (const key of [
            'ownerPhoto',
            'panPhoto',
            'aadhaarFront',
            'aadhaarBack',
          ]) {
            const u = next[key]?.url;
            if (u && String(u).startsWith('blob:')) URL.revokeObjectURL(u);
            delete next[key];
          }
          return next;
        });
      }
      const nextStatus = res.data?.kyc?.status || '';
      if (nextStatus) setStatus(nextStatus);
      setForm((prev) => ({
        ...prev,
        ...(savedKyc
          ? {
              ownerPhoto: null,
              panPhoto: null,
              aadhaarFront: null,
              aadhaarBack: null,
            }
          : {}),
        stores: (prev.stores || []).map((s) => ({
          ...s,
          shopFrontPhotoFile: null,
        })),
      }));
      if (finalSubmit) {
        window.location.href = '/vendor-dashboard';
      } else if (exitAfter) {
        window.location.href = '/vendor-kyc-status';
      } else {
        setStep(targetStep);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit KYC';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      setSavingKind(null);
    }
  };

  const removeDraftAdditionalPhoto = (index) => {
    setDraftStore((p) => {
      const names = [...(p.additionalPhotoNames || [])];
      const urls = [...(p.additionalPhotoUrls || [])];
      const files = [...(p.additionalPhotoFiles || [])];
      names.splice(index, 1);
      urls.splice(index, 1);
      files.splice(index, 1);
      return {
        ...p,
        additionalPhotoNames: names,
        additionalPhotoUrls: urls,
        additionalPhotoFiles: files,
      };
    });
  };

  const addStore = () => {
    const check = validateDraftStoreComplete(draftStore);
    if (!check.ok) {
      toast.error(check.message);
      return;
    }
    const wasEditing = editingStoreIdx >= 0;
    const expandIdx = wasEditing ? editingStoreIdx : form.stores.length;
    setForm((prev) => {
      if (wasEditing) {
        return {
          ...prev,
          stores: prev.stores.map((s, i) =>
            i === editingStoreIdx ? draftStore : s,
          ),
        };
      }
      return { ...prev, stores: [...prev.stores, draftStore] };
    });
    setExpandedStoreIdx(expandIdx);
    setDraftStore(freshEmptyStore());
    setEditingStoreIdx(-1);
    setIsStoreModalOpen(false);
  };

  const onEditStore = (idx) => {
    setEditingStoreIdx(idx);
    const s = form.stores[idx] || {};
    const { names, urls, files } = alignStoreAdditionalPhotoArrays(s);
    setDraftStore({
      ...emptyStore,
      ...s,
      additionalPhotoNames: names,
      additionalPhotoUrls: urls,
      additionalPhotoFiles: files,
    });
    setIsStoreModalOpen(true);
  };

  const onDeleteStore = (idx) => {
    setForm((prev) => ({
      ...prev,
      stores: prev.stores.filter((_, i) => i !== idx),
    }));
    setExpandedStoreIdx((cur) => {
      const nextLen = form.stores.length - 1;
      if (nextLen <= 0) return 0;
      if (cur === idx) return Math.max(0, idx - 1);
      if (cur > idx) return cur - 1;
      return cur;
    });
  };

  const confirmDeletePendingStore = () => {
    if (storeDeleteConfirmIdx === null) return;
    if (!form.stores[storeDeleteConfirmIdx]) {
      setStoreDeleteConfirmIdx(null);
      return;
    }
    onDeleteStore(storeDeleteConfirmIdx);
    setStoreDeleteConfirmIdx(null);
  };

  const closeStoreModal = () => {
    setIsStoreModalOpen(false);
    setEditingStoreIdx(-1);
    setDraftStore(freshEmptyStore());
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
    const lat = Number(place?.lat);
    const lng = Number(place?.lon);
    const display = String(place?.display_name || '');
    const mapLink =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? `https://maps.google.com/?q=${lat},${lng}`
        : '';
    setDraftStore((prev) => ({
      ...prev,
      mapLocation: mapLink,
      mapAddress: display,
      mapLat: Number.isFinite(lat) ? lat : null,
      mapLng: Number.isFinite(lng) ? lng : null,
    }));
    setIsMapModalOpen(false);
  };

  const renderPersonalInfoPngIcon = () =>
    personalInfoIconFailed ? (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50"
        aria-hidden
      >
        <CreditCard className="h-5 w-5 text-sky-600" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={
          typeof personalInfoIcon === 'string'
            ? personalInfoIcon
            : personalInfoIcon.src
        }
        alt=""
        width={40}
        height={40}
        loading="eager"
        decoding="async"
        className="h-10 w-10 shrink-0 rounded-lg object-contain"
        onError={() => setPersonalInfoIconFailed(true)}
      />
    );

  const renderWelcomeKitPngIcon = () =>
    welcomeKitIconFailed ? (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50"
        aria-hidden
      >
        <Gift className="h-5 w-5 text-orange-500" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={
          typeof welcomeKitIcon === 'string'
            ? welcomeKitIcon
            : welcomeKitIcon.src
        }
        alt=""
        width={40}
        height={40}
        loading="eager"
        decoding="async"
        className="h-10 w-10 shrink-0 rounded-lg object-contain"
        onError={() => setWelcomeKitIconFailed(true)}
      />
    );

  const validateProprietorInformation = () => {
    const hasFile = (f) => f instanceof File;
    const hasSaved = (p) => String(p || '').trim().length > 0;
    const missing = [];

    if (
      !hasFile(form.ownerPhoto) &&
      !hasSaved(persistedProprietorDocs.ownerPhoto)
    ) {
      missing.push("Owner's photo");
    }
    if (!String(form.fullName || '').trim()) missing.push('Full name');
    if (!String(form.dateOfBirth || '').trim()) missing.push('Date of birth');
    if (!String(form.permanentAddress || '').trim()) {
      missing.push('Permanent address');
    }
    if (!String(form.contactNumber || '').trim()) {
      missing.push('Contact number');
    }
    if (!String(form.panNumber || '').trim()) missing.push('PAN number');
    if (!String(form.aadhaarNumber || '').trim()) {
      missing.push('Aadhaar number');
    }
    if (
      !hasFile(form.panPhoto) &&
      !hasSaved(persistedProprietorDocs.panPhoto)
    ) {
      missing.push('PAN card photo');
    }
    if (
      !hasFile(form.aadhaarFront) &&
      !hasSaved(persistedProprietorDocs.aadhaarFront)
    ) {
      missing.push('Aadhaar front photo');
    }
    if (
      !hasFile(form.aadhaarBack) &&
      !hasSaved(persistedProprietorDocs.aadhaarBack)
    ) {
      missing.push('Aadhaar back photo');
    }
    if (!String(form.tshirtSize || '').trim()) missing.push('T-shirt size');
    if (!String(form.jeansWaistSize || '').trim()) {
      missing.push('Jeans/waist size');
    }
    if (!String(form.shoeSize || '').trim()) missing.push('Shoe size');

    if (missing.length === 0) return { ok: true };
    const detail =
      missing.length > 6
        ? `${missing.slice(0, 5).join(', ')}, and more`
        : missing.join(', ');
    return {
      ok: false,
      message: `Please fill all Proprietor Information details before continuing.`,
    };
  };

  const validateBusinessDetails = () => {
    const hasFile = (f) => f instanceof File;
    const hasSaved = (p) => String(p || '').trim().length > 0;
    const missing = [];

    if (!String(form.shopName || '').trim()) missing.push('Shop name');
    if (!String(form.businessCategory || '').trim()) {
      missing.push('Business category');
    }
    if (!String(form.shopActNumber || '').trim()) {
      missing.push('Shop Act / MSME license number');
    }
    if (!String(form.primaryContactNumber || '').trim()) {
      missing.push('Primary service contact number');
    }
    if (!String(form.secondaryContactNumber || '').trim()) {
      missing.push('Secondary / technical support contact');
    }

    const hasShopActDoc =
      hasFile(form.shopActLicense) ||
      hasSaved(persistedBusinessDocs.shopActLicense);
    const hasGstDoc =
      hasFile(form.gstCertificate) ||
      hasSaved(persistedBusinessDocs.gstCertificate);
    if (!hasShopActDoc && !hasGstDoc) {
      missing.push('Shop Act license or GST certificate upload');
    }

    if (missing.length === 0) return { ok: true };
    const detail =
      missing.length > 5
        ? `${missing.slice(0, 4).join(', ')}, and more`
        : missing.join(', ');
    return {
      ok: false,
      message: `Please fill all Business Details before continuing.`,
    };
  };

  const validateBankingDetails = () => {
    const hasFile = (f) => f instanceof File;
    const hasSaved = (p) => String(p || '').trim().length > 0;
    const missing = [];

    if (!String(form.accountHolderName || '').trim()) {
      missing.push('Account holder name');
    }
    if (!String(form.accountNumber || '').trim()) {
      missing.push('Account number');
    }
    if (!String(form.confirmAccountNumber || '').trim()) {
      missing.push('Confirm account number');
    }
    if (
      String(form.accountNumber || '').trim() &&
      String(form.confirmAccountNumber || '').trim() &&
      form.accountNumber.trim() !== form.confirmAccountNumber.trim()
    ) {
      missing.push('Account numbers must match');
    }
    if (!String(form.ifscCode || '').trim()) missing.push('IFSC code');
    if (
      !hasFile(form.cancelledCheque) &&
      !hasSaved(persistedBankDocs.cancelledCheque)
    ) {
      missing.push('Cancelled cheque / bank passbook');
    }

    if (missing.length === 0) return { ok: true };
    const detail = missing.join(', ');
    return {
      ok: false,
      message: `Please fill all Banking Details before continuing.`,
    };
  };

  const validateForwardStepNavigation = (targetStep) => {
    if (targetStep <= step) return { ok: true };
    const v1 = validateProprietorInformation();
    if (!v1.ok) return v1;
    if (targetStep >= 3) {
      const v2 = validateBusinessDetails();
      if (!v2.ok) return v2;
    }
    if (targetStep >= 4) {
      const v3 = validateBankingDetails();
      if (!v3.ok) return v3;
    }
    return { ok: true };
  };

  const validateStep4ForFinalSubmit = () => {
    if (!form.slaAccepted) {
      return {
        ok: false,
        message: 'Please tick I agree to the Terms of Service.',
      };
    }
    if (!form.commissionAccepted) {
      return {
        ok: false,
        message: 'Please tick I accept the Platform Commission policy.',
      };
    }
    if (!Array.isArray(form.stores) || form.stores.length === 0) {
      return {
        ok: false,
        message: 'Please create at least one store.',
      };
    }
    return { ok: true, message: '' };
  };

  const handleFinalSubmitApplication = () => {
    const v1 = validateProprietorInformation();
    if (!v1.ok) {
      toast.error(v1.message);
      setStep(1);
      return;
    }
    const v2 = validateBusinessDetails();
    if (!v2.ok) {
      toast.error(v2.message);
      setStep(2);
      return;
    }
    const v3 = validateBankingDetails();
    if (!v3.ok) {
      toast.error(v3.message);
      setStep(3);
      return;
    }
    const v4 = validateStep4ForFinalSubmit();
    if (!v4.ok) {
      toast.error(v4.message);
      return;
    }
    saveStep({ targetStep: 4, finalSubmit: true });
  };

  const handleSaveAndContinue = () => {
    if (step === 1) {
      const check = validateProprietorInformation();
      if (!check.ok) {
        toast.error(check.message);
        return;
      }
    }
    if (step === 2) {
      const check = validateBusinessDetails();
      if (!check.ok) {
        toast.error(check.message);
        return;
      }
    }
    if (step === 3) {
      const check = validateBankingDetails();
      if (!check.ok) {
        toast.error(check.message);
        return;
      }
    }
    saveStep({ targetStep: step + 1 });
  };

  const getIdentityDocFilename = (field) => {
    const f = form[field];
    if (f instanceof File) return f.name;
    const meta = filePreviews[field];
    if (meta?.name) return meta.name;
    const saved = persistedProprietorDocs[field];
    if (!String(saved || '').trim()) return '';
    const seg = saved.split('/').pop() || saved;
    try {
      return decodeURIComponent(String(seg).split('?')[0]);
    } catch {
      return 'Uploaded file';
    }
  };

  const hasIdentityDoc = (field) =>
    form[field] instanceof File ||
    Boolean(filePreviews[field]?.name) ||
    Boolean(String(persistedProprietorDocs[field] || '').trim());

  const ownerPhotoPreviewUrl =
    filePreviews.ownerPhoto?.isImage && filePreviews.ownerPhoto?.url
      ? filePreviews.ownerPhoto.url
      : String(persistedProprietorDocs.ownerPhoto || '').trim();

  const renderIdentityDocFilename = (field) => {
    const fn = getIdentityDocFilename(field);
    if (!fn) return null;
    return (
      <p
        className="mt-2 px-1 text-center text-[11px] font-medium text-emerald-600 truncate"
        title={fn}
      >
        {fn}
      </p>
    );
  };

  const getBusinessDocFilename = (field) => {
    const f = form[field];
    if (f instanceof File) return f.name;
    const meta = filePreviews[field];
    if (meta?.name) return meta.name;
    const displayName = persistedBusinessDocs[`${field}FileName`];
    if (String(displayName || '').trim()) return String(displayName).trim();
    const saved = persistedBusinessDocs[field];
    if (!String(saved || '').trim()) return '';
    const seg = saved.split('/').pop() || saved;
    try {
      return decodeURIComponent(String(seg).split('?')[0]);
    } catch {
      return 'Uploaded file';
    }
  };

  const hasBusinessDoc = (field) =>
    form[field] instanceof File ||
    Boolean(filePreviews[field]?.name) ||
    Boolean(String(persistedBusinessDocs[field] || '').trim());

  const renderBusinessDocFilename = (field) => {
    const fn = getBusinessDocFilename(field);
    if (!fn) return null;
    return (
      <p
        className="mt-2 truncate px-1 text-center text-[11px] font-medium text-emerald-600"
        title={fn}
      >
        {fn}
      </p>
    );
  };

  const getCancelledChequeFilename = () => {
    const f = form.cancelledCheque;
    if (f instanceof File) return f.name;
    const meta = filePreviews.cancelledCheque;
    if (meta?.name) return meta.name;
    const saved = persistedBankDocs.cancelledCheque;
    if (!String(saved || '').trim()) return '';
    const seg = saved.split('/').pop() || saved;
    try {
      return decodeURIComponent(String(seg).split('?')[0]);
    } catch {
      return 'Uploaded file';
    }
  };

  const hasCancelledChequeDoc = () =>
    form.cancelledCheque instanceof File ||
    Boolean(filePreviews.cancelledCheque?.name) ||
    Boolean(String(persistedBankDocs.cancelledCheque || '').trim());

  const renderCancelledChequeFilename = () => {
    const fn = getCancelledChequeFilename();
    if (!fn) return null;
    return (
      <p
        className="mt-2 truncate text-center text-[11px] font-medium text-emerald-600"
        title={fn}
      >
        {fn}
      </p>
    );
  };

  const renderBankAccountHeaderPngIcon = () =>
    bankAccountHeaderIconFailed ? (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100"
        aria-hidden
      >
        <Landmark className="h-4 w-4 text-slate-700" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={
          typeof bankAccountDetailsIcon === 'string'
            ? bankAccountDetailsIcon
            : bankAccountDetailsIcon.src
        }
        alt=""
        width={28}
        height={28}
        loading="eager"
        decoding="async"
        className="h-7 w-7 shrink-0 rounded-lg object-contain"
        onError={() => setBankAccountHeaderIconFailed(true)}
      />
    );

  const renderSecureFooterPngIcon = () =>
    secureFooterIconFailed ? (
      <span className="mt-0.5 flex shrink-0" aria-hidden>
        <Shield className="h-4 w-4 text-emerald-600" strokeWidth={2} />
      </span>
    ) : (
      <img
        src={
          typeof secureFooterIcon === 'string'
            ? secureFooterIcon
            : secureFooterIcon.src
        }
        alt=""
        width={20}
        height={20}
        loading="lazy"
        decoding="async"
        className="mt-0.5 h-5 w-5 shrink-0 object-contain"
        onError={() => setSecureFooterIconFailed(true)}
      />
    );

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
        src={
          typeof shopHeadingIcon === 'string'
            ? shopHeadingIcon
            : shopHeadingIcon.src
        }
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
        src={
          typeof serviceModeHeadingIcon === 'string'
            ? serviceModeHeadingIcon
            : serviceModeHeadingIcon.src
        }
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
        src={
          typeof walkInHeadingIcon === 'string'
            ? walkInHeadingIcon
            : walkInHeadingIcon.src
        }
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
        src={
          typeof termsHeadingIcon === 'string'
            ? termsHeadingIcon
            : termsHeadingIcon.src
        }
        alt=""
        width={32}
        height={32}
        loading="lazy"
        decoding="async"
        className="h-8 w-8 shrink-0 rounded-lg object-contain"
        onError={() => setStoreTermsIconFailed(true)}
      />
    );

  const renderBusinessInfoPngIcon = () =>
    businessInfoIconFailed ? (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50"
        aria-hidden
      >
        <Store className="h-5 w-5 text-sky-600" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={
          typeof businessInfoIcon === 'string'
            ? businessInfoIcon
            : businessInfoIcon.src
        }
        alt=""
        width={40}
        height={40}
        loading="eager"
        decoding="async"
        className="h-10 w-10 shrink-0 rounded-lg object-contain"
        onError={() => setBusinessInfoIconFailed(true)}
      />
    );

  const renderBusinessVerificationPngIcon = () =>
    businessVerificationIconFailed ? (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50"
        aria-hidden
      >
        <FileText className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={
          typeof businessVerificationIcon === 'string'
            ? businessVerificationIcon
            : businessVerificationIcon.src
        }
        alt=""
        width={40}
        height={40}
        loading="eager"
        decoding="async"
        className="h-10 w-10 shrink-0 rounded-lg object-contain"
        onError={() => setBusinessVerificationIconFailed(true)}
      />
    );

  const renderSupportContactPngIcon = () =>
    supportContactIconFailed ? (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50"
        aria-hidden
      >
        <Phone className="h-5 w-5 text-violet-600" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={
          typeof supportContactIcon === 'string'
            ? supportContactIcon
            : supportContactIcon.src
        }
        alt=""
        width={40}
        height={40}
        loading="eager"
        decoding="async"
        className="h-10 w-10 shrink-0 rounded-lg object-contain"
        onError={() => setSupportContactIconFailed(true)}
      />
    );

  const renderStoreCfgBasicInfoIcon = () =>
    storeCfgBasicPngFailed ? (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100"
        aria-hidden
      >
        <Store className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={
          typeof basicInfoModalIcon === 'string'
            ? basicInfoModalIcon
            : basicInfoModalIcon.src
        }
        alt=""
        width={36}
        height={36}
        loading="lazy"
        decoding="async"
        className="h-9 w-9 shrink-0 rounded-lg object-contain"
        onError={() => setStoreCfgBasicPngFailed(true)}
      />
    );

  const renderStoreCfgMapIcon = () =>
    storeCfgMapPngFailed ? (
      <span className="flex shrink-0 flex-col items-center gap-1" aria-hidden>
        <MapPin className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
      </span>
    ) : (
      <img
        src={typeof mapModalIcon === 'string' ? mapModalIcon : mapModalIcon.src}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        className="mx-auto h-10 w-10 object-contain"
        onError={() => setStoreCfgMapPngFailed(true)}
      />
    );

  const renderStoreCfgStorePhotoIcon = () =>
    storeCfgStorePhotoPngFailed ? (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100"
        aria-hidden
      >
        <Camera className="h-5 w-5 text-orange-600" strokeWidth={1.75} />
      </span>
    ) : (
      <img
        src={
          typeof storePhotoModalIcon === 'string'
            ? storePhotoModalIcon
            : storePhotoModalIcon.src
        }
        alt=""
        width={36}
        height={36}
        loading="lazy"
        decoding="async"
        className="h-9 w-9 shrink-0 rounded-lg object-contain"
        onError={() => setStoreCfgStorePhotoPngFailed(true)}
      />
    );

  const renderStoreCfgVerifiedShieldIcon = () =>
    storeCfgVerifiedShieldPngFailed ? (
      <Shield
        className="h-3.5 w-3.5 text-emerald-600"
        strokeWidth={2}
        aria-hidden
      />
    ) : (
      <img
        src={
          typeof secureFooterIcon === 'string'
            ? secureFooterIcon
            : secureFooterIcon.src
        }
        alt=""
        width={14}
        height={14}
        loading="lazy"
        decoding="async"
        className="h-3.5 w-3.5 shrink-0 object-contain"
        onError={() => setStoreCfgVerifiedShieldPngFailed(true)}
      />
    );

  const renderStoreCfgDeliveryZoneIcon = () =>
    storeCfgDeliveryPngFailed ? (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100"
        aria-hidden
      >
        <Truck className="h-4 w-4 text-violet-600" strokeWidth={2} />
      </span>
    ) : (
      <img
        src={
          typeof deliveryZoneModalIcon === 'string'
            ? deliveryZoneModalIcon
            : deliveryZoneModalIcon.src
        }
        alt=""
        width={32}
        height={32}
        loading="lazy"
        decoding="async"
        className="h-8 w-8 shrink-0 object-contain"
        onError={() => setStoreCfgDeliveryPngFailed(true)}
      />
    );

  const renderStoreCfgCustomerWalkIcon = () =>
    storeCfgWalkPngFailed ? (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100"
        aria-hidden
      >
        <Store className="h-4 w-4 text-emerald-700" strokeWidth={2} />
      </span>
    ) : (
      <img
        src={
          typeof customerWalkModalIcon === 'string'
            ? customerWalkModalIcon
            : customerWalkModalIcon.src
        }
        alt=""
        width={32}
        height={32}
        loading="lazy"
        decoding="async"
        className="h-8 w-8 shrink-0 object-contain"
        onError={() => setStoreCfgWalkPngFailed(true)}
      />
    );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-6 px-3 sm:px-5">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-3">
              <Image
                src={
                  step === 2 || step === 3 || step === 4 ? step2Icon : step1Icon
                }
                alt=""
                width={48}
                height={48}
                className="mt-0.5 h-12 w-12 shrink-0 rounded-xl object-cover"
                priority
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Vendor KYC Verification
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  Step {step} of 4: {KYC_STEPPER_STEPS[step - 1]?.label}
                </p>
                {status ? (
                  <p className="mt-2 text-xs text-gray-600">
                    Current KYC Status:{' '}
                    <span className="font-semibold capitalize">{status}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveStep({ targetStep: step, exitAfter: true })}
            className="shrink-0 self-start rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 sm:self-auto"
          >
            {saving && savingKind === 'exit' ? 'Saving...' : 'Save & Exit'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-6">
          <nav className="w-full pt-1 pb-2" aria-label="KYC steps">
            <div className="mx-auto flex w-full max-w-3xl justify-center px-0 sm:px-1">
              {/*
                Track: one rounded-full bar from column 1 center → column 4 center
                (12.5% … 87.5%). Dot row is fixed 22px so the bar meets each dot center.
              */}
              <div className="relative w-full">
                <div
                  className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[11px] z-0 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-gray-200"
                  aria-hidden
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-orange-500 transition-[width] duration-300 ease-out"
                    style={{
                      width: step <= 1 ? '0%' : `${((step - 1) / 3) * 100}%`,
                    }}
                  />
                </div>
                <div className="relative z-[1] flex w-full items-start justify-center">
                  {KYC_STEPPER_STEPS.map((s) => {
                    const isCurrent = step === s.step;
                    const isPast = step > s.step;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          if (s.step > step) {
                            const nav = validateForwardStepNavigation(s.step);
                            if (!nav.ok) {
                              toast.error(nav.message);
                              return;
                            }
                          }
                          setStep(s.step);
                        }}
                        className="group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl px-0.5 pb-1 pt-0 text-center transition hover:bg-orange-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span className="flex h-[22px] w-full shrink-0 items-center justify-center">
                          <span
                            className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-white transition ${
                              isCurrent
                                ? 'border-orange-500 bg-orange-500 shadow-sm'
                                : isPast
                                  ? 'border-orange-400 bg-white'
                                  : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isPast && !isCurrent ? (
                              <span className="h-2 w-2 rounded-full bg-orange-500" />
                            ) : null}
                          </span>
                        </span>
                        <span
                          className={`max-w-[5.5rem] text-[10px] font-semibold leading-snug sm:max-w-none sm:text-xs ${
                            isCurrent
                              ? 'text-orange-600'
                              : 'text-gray-500 group-hover:text-orange-700'
                          }`}
                        >
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>

          {step === 1 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Proprietor Information
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Tell us about the business owner for KYC verification
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-8 space-y-12 sm:space-y-16">
                <div>
                  <div className="flex items-start gap-2.5">
                    <Image
                      src={ownerPhotoIcon}
                      alt=""
                      width={40}
                      height={40}
                      className="mt-0.5 h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-gray-900">
                        Owner&apos;s Photo
                      </p>
                      <p className="text-xs text-gray-500">
                        Upload a clear photo for profile verification
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      id="kyc-owner-photo-file"
                      type="file"
                      name="ownerPhoto"
                      accept="image/*"
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="kyc-owner-photo-file"
                      className="relative h-20 w-20 shrink-0 cursor-pointer"
                    >
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50">
                        {ownerPhotoPreviewUrl ? (
                          <img
                            src={ownerPhotoPreviewUrl}
                            alt="Owner preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User
                            className="h-11 w-11 text-gray-400"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        )}
                      </div>
                      {!ownerPhotoPreviewUrl ? (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-md ring-2 ring-white"
                          aria-hidden
                        >
                          <Camera className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                      ) : null}
                    </label>
                    <div className="space-y-1">
                      <label
                        htmlFor="kyc-owner-photo-file"
                        className="inline-block cursor-pointer"
                      >
                        <span className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          {hasIdentityDoc('ownerPhoto')
                            ? 'Reupload Image'
                            : 'Upload Image'}
                        </span>
                      </label>
                      <p className="text-[11px] text-gray-500">
                        JPG or PNG - Max 3MB - Face clearly visible
                      </p>
                      {(() => {
                        const fn = getIdentityDocFilename('ownerPhoto');
                        if (!fn) return null;
                        return (
                          <p
                            className="text-[11px] text-emerald-600 truncate max-w-xs"
                            title={fn}
                          >
                            {form.ownerPhoto instanceof File
                              ? `Selected: ${fn}`
                              : fn}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    {renderPersonalInfoPngIcon()}
                    <h3 className="text-base font-semibold text-gray-900">
                      Personal Information
                    </h3>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="kyc-full-name"
                          className="block text-sm font-semibold text-gray-900"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="kyc-full-name"
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder="FULL NAME"
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 placeholder:uppercase"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="kyc-date-of-birth"
                          className="block text-sm font-semibold text-gray-900"
                        >
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="kyc-date-of-birth"
                          name="dateOfBirth"
                          type="date"
                          value={form.dateOfBirth}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-permanent-address"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Permanent Address{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="kyc-permanent-address"
                        name="permanentAddress"
                        value={form.permanentAddress}
                        onChange={handleChange}
                        placeholder="ADDRESS"
                        rows={4}
                        className="min-h-[100px] w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 placeholder:uppercase"
                      />
                    </div>

                    <div className="space-y-1.5 md:max-w-[calc(50%-0.5rem)]">
                      <label
                        htmlFor="kyc-contact-number"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-contact-number"
                        name="contactNumber"
                        value={form.contactNumber}
                        onChange={handleChange}
                        placeholder="NUMBER"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 placeholder:uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-2.5">
                    {renderPersonalInfoPngIcon()}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Identity Proofs (KYC Documents)
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Upload government-issued ID cards for verification
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                    <div className="space-y-3">
                      <label
                        htmlFor="kyc-pan-number"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        PAN Card <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-pan-number"
                        name="panNumber"
                        value={form.panNumber}
                        onChange={handleChange}
                        placeholder="E.G., ABCDE1234F"
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
                      />
                      <div>
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            name="panPhoto"
                            accept="image/*"
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className="flex min-h-[152px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/90 px-4 py-6 text-center transition hover:border-gray-300 hover:bg-gray-50">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                              <Upload
                                className="h-5 w-5"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {hasIdentityDoc('panPhoto')
                                ? 'Reupload PAN Card Photo'
                                : 'Upload PAN Card Photo'}
                            </span>
                            <span className="text-xs text-gray-500">
                              Clear image of card
                            </span>
                          </div>
                        </label>
                        {renderIdentityDocFilename('panPhoto')}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label
                        htmlFor="kyc-aadhaar-number"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Aadhaar Card <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-aadhaar-number"
                        name="aadhaarNumber"
                        value={form.aadhaarNumber}
                        onChange={handleChange}
                        placeholder="XXXX XXXX XXXX"
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500">
                            Front Side
                          </p>
                          <label className="block cursor-pointer">
                            <input
                              type="file"
                              name="aadhaarFront"
                              accept="image/*"
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/90 px-2 py-4 text-center transition hover:border-gray-300 hover:bg-gray-50">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                                <Upload
                                  className="h-4 w-4"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </span>
                              <span className="text-xs font-semibold text-gray-800">
                                {hasIdentityDoc('aadhaarFront')
                                  ? 'Reupload Front'
                                  : 'Upload Front'}
                              </span>
                            </div>
                          </label>
                          {renderIdentityDocFilename('aadhaarFront')}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500">
                            Back Side
                          </p>
                          <label className="block cursor-pointer">
                            <input
                              type="file"
                              name="aadhaarBack"
                              accept="image/*"
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/90 px-2 py-4 text-center transition hover:border-gray-300 hover:bg-gray-50">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                                <Upload
                                  className="h-4 w-4"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </span>
                              <span className="text-xs font-semibold text-gray-800">
                                {hasIdentityDoc('aadhaarBack')
                                  ? 'Reupload Back'
                                  : 'Upload Back'}
                              </span>
                            </div>
                          </label>
                          {renderIdentityDocFilename('aadhaarBack')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] leading-snug text-sky-900">
                    <Info
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <p>
                      <span className="font-semibold text-blue-800">
                        Privacy:
                      </span>{' '}
                      Your documents are encrypted and used only for KYC
                      verification as per RBI guidelines.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-2.5">
                    {renderWelcomeKitPngIcon()}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Personalize your Welcome Kit 🎁
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Select sizes for your free Rentnpay partner uniform
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-tshirt-size"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        T-Shirt Size <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="kyc-tshirt-size"
                        name="tshirtSize"
                        value={form.tshirtSize}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      >
                        <option value="">Select size</option>
                        <option>S</option>
                        <option>M</option>
                        <option>L</option>
                        <option>XL</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-jeans-waist-size"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Jeans/Waist Size <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="kyc-jeans-waist-size"
                        name="jeansWaistSize"
                        value={form.jeansWaistSize}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      >
                        <option value="">Select size</option>
                        <option>30</option>
                        <option>32</option>
                        <option>34</option>
                        <option>36</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-shoe-size"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Shoe Size <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="kyc-shoe-size"
                        name="shoeSize"
                        value={form.shoeSize}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      >
                        <option value="">Select size</option>
                        <option>7</option>
                        <option>8</option>
                        <option>9</option>
                        <option>10</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Tell us about your Business
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Provide your shop details and business documents for
                  verification
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-8 space-y-12 sm:space-y-14">
                <div>
                  <div className="flex items-start gap-2.5">
                    {renderBusinessInfoPngIcon()}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Business Information
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Enter your business name and category
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-shop-name"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Shop Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-shop-name"
                        name="shopName"
                        value={form.shopName}
                        onChange={handleChange}
                        placeholder="e.g. Rahul Electronics"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-business-category"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Business Category{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="kyc-business-category"
                        name="businessCategory"
                        value={form.businessCategory}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      >
                        <option value="">Select category</option>
                        {form.businessCategory &&
                        !BUSINESS_CATEGORY_OPTIONS.includes(
                          form.businessCategory,
                        ) ? (
                          <option value={form.businessCategory}>
                            {form.businessCategory}
                          </option>
                        ) : null}
                        {BUSINESS_CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-2.5">
                    {renderBusinessVerificationPngIcon()}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Business Verification
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Provide your business registration documents
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-shop-act-number"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Shop Act / MSME License Number{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-shop-act-number"
                        name="shopActNumber"
                        value={form.shopActNumber}
                        onChange={handleChange}
                        placeholder="e.g., SA/2023/12345 or MSME-001234"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        Enter your Shop Act registration or MSME certificate
                        number
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-gray-900">
                          Shop Act License
                        </p>
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            name="shopActLicense"
                            accept="image/*,.pdf"
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className="flex min-h-[128px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/90 px-3 py-5 text-center transition hover:border-gray-400 hover:bg-gray-50">
                            <Upload
                              className="h-8 w-8 text-gray-400"
                              strokeWidth={1.5}
                              aria-hidden
                            />
                            <p className="text-sm font-medium text-gray-800">
                              {hasBusinessDoc('shopActLicense')
                                ? 'Reupload document'
                                : 'Upload Document'}
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, JPG or PNG (Max 5MB)
                            </p>
                          </div>
                        </label>
                        {renderBusinessDocFilename('shopActLicense')}
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-gray-900">
                          GST Certificate{' '}
                          <span className="font-normal text-gray-500">
                            (Optional)
                          </span>
                        </p>
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            name="gstCertificate"
                            accept="image/*,.pdf"
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className="flex min-h-[128px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/90 px-3 py-5 text-center transition hover:border-gray-400 hover:bg-gray-50">
                            <Upload
                              className="h-8 w-8 text-gray-400"
                              strokeWidth={1.5}
                              aria-hidden
                            />
                            <p className="text-sm font-medium text-gray-800">
                              {hasBusinessDoc('gstCertificate')
                                ? 'Reupload document'
                                : 'Upload Document'}
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, JPG or PNG (Max 5MB)
                            </p>
                          </div>
                        </label>
                        {renderBusinessDocFilename('gstCertificate')}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-gstin"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        GSTIN{' '}
                        <span className="font-normal text-gray-500">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="kyc-gstin"
                        name="gstin"
                        value={form.gstin}
                        onChange={handleChange}
                        placeholder="E.G., 29ABCDE1234F1Z5"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        15-digit GST Identification Number (if applicable)
                      </p>
                    </div>

                    <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-[11px] leading-snug text-blue-900">
                      <Info
                        className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <p>
                        <span className="font-semibold text-blue-900">
                          Note:
                        </span>{' '}
                        At least one document is required. GST Certificate is
                        mandatory for businesses with annual turnover above ₹40
                        lakhs.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-2.5">
                    {renderSupportContactPngIcon()}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Support Contacts
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Contact numbers for customer and admin support
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-primary-contact"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Primary Service Contact Number{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-primary-contact"
                        name="primaryContactNumber"
                        value={form.primaryContactNumber}
                        onChange={handleChange}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        For customers to reach you regarding orders and services
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-secondary-contact"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Secondary / Technical Support Contact{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-secondary-contact"
                        name="secondaryContactNumber"
                        value={form.secondaryContactNumber}
                        onChange={handleChange}
                        placeholder="e.g. +91 98765 43211"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        For admin to reach you regarding platform and technical
                        issues
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-8">
                <div className="flex items-start gap-2.5">
                  {renderBankAccountHeaderPngIcon()}
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                    Bank Account Details
                  </h2>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="kyc-account-holder"
                      className="block text-sm font-semibold text-gray-900"
                    >
                      Account Holder Name{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="kyc-account-holder"
                      name="accountHolderName"
                      value={form.accountHolderName}
                      onChange={handleChange}
                      placeholder="As per bank records"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-account-number"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-account-number"
                        name="accountNumber"
                        value={form.accountNumber}
                        onChange={handleChange}
                        placeholder="Enter account number"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kyc-confirm-account-number"
                        className="block text-sm font-semibold text-gray-900"
                      >
                        Confirm Account Number{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="kyc-confirm-account-number"
                        name="confirmAccountNumber"
                        value={form.confirmAccountNumber}
                        onChange={handleChange}
                        placeholder="Re-enter account number"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="kyc-ifsc"
                      className="block text-sm font-semibold text-gray-900"
                    >
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="kyc-ifsc"
                      name="ifscCode"
                      value={form.ifscCode}
                      onChange={handleChange}
                      placeholder="E.G., SBIN0001234"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                    />
                    <p className="text-xs text-gray-500">
                      11-character bank branch code
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Upload Cancelled Cheque / Bank Passbook{' '}
                      <span className="text-red-500">*</span>
                    </p>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        name="cancelledCheque"
                        accept="image/*,.pdf"
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex min-h-[132px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/90 px-4 py-6 text-center transition hover:border-gray-400 hover:bg-gray-50">
                        <Upload
                          className="h-9 w-9 text-gray-400"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        <p className="text-sm font-medium text-gray-800">
                          {hasCancelledChequeDoc()
                            ? 'Click to reupload cancelled cheque'
                            : 'Click to upload cancelled cheque'}
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF or JPG • Max 5MB
                        </p>
                      </div>
                    </label>
                    {renderCancelledChequeFilename()}
                    <p className="text-[11px] text-gray-500">
                      For account verification, write &quot;CANCELLED&quot;
                      across the cheque.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5 text-xs leading-snug text-gray-700">
                  {renderSecureFooterPngIcon()}
                  <p>
                    <span className="font-bold text-gray-900">
                      Secure &amp; Confidential:
                    </span>{' '}
                    All your bank and financial information is encrypted and
                    stored securely. We will verify your details within 24-48
                    hours.
                  </p>
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Manage Stores
                  </h2>
                  <p className="text-xs text-gray-500">
                    Configure your physical outlets and delivery zones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStoreIdx(-1);
                    setDraftStore(freshEmptyStore());
                    setIsStoreModalOpen(true);
                  }}
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Add New Store
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[11px] text-gray-500">Total Stores</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {form.stores.length}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-[11px] text-gray-500">Active Stores</p>
                  <p className="text-xl font-semibold text-emerald-700">
                    {form.stores.filter((st) => st.isActive !== false).length}
                  </p>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-3">
                  <p className="text-[11px] text-gray-500">Physical Stores</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {form.stores.filter((st) => st.allowsWalkIn).length}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {form.stores.length === 0 ? (
                  <p className="text-sm text-gray-500">No stores added yet.</p>
                ) : (
                  form.stores.map((s, i) => {
                    const isExpanded = expandedStoreIdx === i;
                    const walkInNoPublic =
                      !s.allowsWalkIn ||
                      (s.walkInAccessLabel || '')
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
                                onClick={() => onEditStore(i)}
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
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-4 sm:p-5">
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
                      checked={form.slaAccepted}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          slaAccepted: e.target.checked,
                        }))
                      }
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
                      checked={form.commissionAccepted}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          commissionAccepted: e.target.checked,
                        }))
                      }
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
              </div>
            </section>
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {step === 4 ? (
            <div className="flex w-full flex-col gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleFinalSubmitApplication}
                className="w-full rounded-xl bg-orange-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 sm:py-3.5"
              >
                {saving && savingKind === 'submit' ? (
                  'Submitting...'
                ) : (
                  <span className="inline-flex items-center justify-center gap-1">
                    Submit Application
                    <span aria-hidden className="text-base font-semibold">
                      →
                    </span>
                  </span>
                )}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setStep(2)}
                className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                ← Back to Business Details
              </button>
            </div>
          ) : (
            <div className="flex justify-between">
              <button
                type="button"
                disabled={saving || step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                <ArrowLeft
                  className="h-4 w-4 shrink-0 opacity-80"
                  strokeWidth={2.25}
                  aria-hidden
                />
                Previous Step
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAndContinue}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {saving && savingKind === 'continue' ? (
                  'Saving...'
                ) : (
                  <>
                    {step === 2
                      ? 'Continue to Bank Details'
                      : step === 3
                        ? 'Continue to Store Management'
                        : 'Save & Continue'}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 opacity-95"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {isStoreModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStoreIdx >= 0
                  ? 'Edit Store Settings'
                  : 'Configure Store Settings'}
              </h3>
              <button
                type="button"
                onClick={closeStoreModal}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
              <div className="space-y-4">
              <div className="space-y-3 rounded-xl border-2 border-sky-200 bg-sky-50/40 p-4">
                <div className="flex items-center gap-2.5">
                  {renderStoreCfgBasicInfoIcon()}
                  <p className="text-sm font-bold text-gray-900">
                    Basic Information
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="kyc-modal-store-name"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    Store Name{' '}
                    <span className="text-red-500" aria-hidden>
                      *
                    </span>
                  </label>
                  <input
                    id="kyc-modal-store-name"
                    value={draftStore.storeName}
                    onChange={(e) =>
                      setDraftStore((p) => ({
                        ...p,
                        storeName: e.target.value,
                      }))
                    }
                    placeholder="e.g., Baner Branch"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-sky-200 transition focus:border-sky-400 focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="kyc-modal-store-address"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    Complete Address{' '}
                    <span className="text-red-500" aria-hidden>
                      *
                    </span>
                  </label>
                  <textarea
                    id="kyc-modal-store-address"
                    value={draftStore.completeAddress}
                    onChange={(e) =>
                      setDraftStore((p) => ({
                        ...p,
                        completeAddress: e.target.value,
                      }))
                    }
                    placeholder="Enter full address with landmarks"
                    className="min-h-24 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-sky-200 transition focus:border-sky-400 focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="kyc-modal-store-pincode"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    Pincode{' '}
                    <span className="text-red-500" aria-hidden>
                      *
                    </span>
                  </label>
                  <input
                    id="kyc-modal-store-pincode"
                    value={draftStore.pincode}
                    onChange={(e) =>
                      setDraftStore((p) => ({ ...p, pincode: e.target.value }))
                    }
                    placeholder="e.g., 411038"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-sky-200 transition focus:border-sky-400 focus:ring-2"
                  />
                </div>
                <div className="rounded-xl border border-sky-200 bg-white/90 p-3">
                  <p className="mb-2 text-xs font-semibold text-gray-600">
                    Pin Location on Map
                  </p>
                  <div className="flex min-h-[148px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-5 text-center">
                    {renderStoreCfgMapIcon()}
                    <p className="mt-2 text-sm font-semibold text-gray-800">
                      Interactive Map Widget
                    </p>
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
                      className="mt-3 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      Open Map Selector
                    </button>
                  </div>
                  {draftStore.mapAddress ? (
                    <p className="mt-2 truncate text-[11px] text-gray-600">
                      Selected: {draftStore.mapAddress}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-sky-200 bg-white/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-2.5">
                    {renderStoreCfgStorePhotoIcon()}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        Store Photos
                      </p>
                      <p className="text-xs text-gray-500">
                        Upload clear photos of your store for verification
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold  tracking-wide text-emerald-700">
                    {renderStoreCfgVerifiedShieldIcon()}
                    For Verified Badge
                  </span>
                </div>
                <div className="mt-5 space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      Shop Frontage with Signboard{' '}
                      <span className="text-red-500" aria-hidden>
                        *
                      </span>
                    </label>
                    <input
                      id="kyc-modal-shop-front-file"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setDraftStore((p) => ({
                          ...p,
                          shopFrontPhotoName: f?.name || '',
                          shopFrontPhotoFile: f,
                        }));
                      }}
                    />
                    <label
                      htmlFor="kyc-modal-shop-front-file"
                      className="flex min-h-[168px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-50/90 px-4 py-8 text-center transition hover:border-orange-400"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-md">
                        <Camera className="h-7 w-7" strokeWidth={1.75} />
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {draftStore.shopFrontPhotoFile instanceof File ||
                        String(draftStore.shopFrontPhotoUrl || '').trim() ||
                        String(draftStore.shopFrontPhotoName || '').trim()
                          ? 'Reupload Store Front Photo'
                          : 'Upload Store Front Photo'}
                      </span>
                      <span className="text-xs text-gray-600">
                        Clear photo showing shop name board
                      </span>
                      <span className="text-[11px] font-semibold text-orange-600">
                        Required for &apos;Physically Verified&apos; badge
                      </span>
                    </label>
                    {draftStore.shopFrontPhotoName ? (
                      <p
                        className="truncate text-center text-xs font-medium text-emerald-600"
                        title={draftStore.shopFrontPhotoName}
                      >
                        {draftStore.shopFrontPhotoName}
                      </p>
                    ) : null}
                  </div>
                  <div className="border-t border-sky-100 pt-6">
                    <label className="block text-sm font-semibold text-gray-900">
                      Additional Store Photos (Optional)
                    </label>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div
                        className={`w-full shrink-0 sm:w-1/2 sm:max-w-[50%] ${
                          (draftStore.additionalPhotoNames || []).length >= 4
                            ? 'opacity-60'
                            : ''
                        }`}
                      >
                        <input
                          id="kyc-modal-additional-photos-file"
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={
                            (draftStore.additionalPhotoNames || []).length >= 4
                          }
                          className="sr-only"
                          onChange={(e) => {
                            const picked = Array.from(e.target.files || []);
                            setDraftStore((p) => {
                              const names = [...(p.additionalPhotoNames || [])];
                              const urls = [...(p.additionalPhotoUrls || [])];
                              const files = [...(p.additionalPhotoFiles || [])];
                              const L = Math.max(
                                names.length,
                                urls.length,
                                files.length,
                              );
                              while (names.length < L) names.push('');
                              while (urls.length < L) urls.push('');
                              while (files.length < L) files.push(null);
                              for (const file of picked) {
                                if (names.length >= 4) break;
                                names.push(file.name);
                                urls.push('');
                                files.push(file);
                              }
                              return {
                                ...p,
                                additionalPhotoNames: names,
                                additionalPhotoUrls: urls,
                                additionalPhotoFiles: files,
                              };
                            });
                            e.target.value = '';
                          }}
                        />
                        {(draftStore.additionalPhotoNames || []).length >= 4 ? (
                          <div className="mt-0 flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/90 px-3 py-6 text-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm">
                              <Upload className="h-6 w-6" strokeWidth={1.75} />
                            </span>
                            <span className="text-sm font-bold text-gray-700">
                              Maximum 4 photos
                            </span>
                          </div>
                        ) : (
                          <label
                            htmlFor="kyc-modal-additional-photos-file"
                            className="mt-0 flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/90 px-3 py-6 text-center transition hover:border-slate-400 hover:bg-slate-50"
                          >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm">
                              <Upload className="h-6 w-6" strokeWidth={1.75} />
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              Add photo
                            </span>
                          </label>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                        {(draftStore.additionalPhotoNames || []).map(
                          (name, i) => {
                            const file = draftStore.additionalPhotoFiles?.[i];
                            const url = draftStore.additionalPhotoUrls?.[i];
                            const blob = additionalPhotoBlobUrls[i];
                            const src =
                              file instanceof File && blob
                                ? blob
                                : String(url || '').trim()
                                  ? url
                                  : '';
                            return (
                              <div
                                key={`additional-ph-${i}-${name}`}
                                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm"
                              >
                                {src ? (
                                  <img
                                    src={src}
                                    alt={`Additional store photo ${i + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] leading-tight text-gray-500">
                                    {name || 'Photo'}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  aria-label={`Remove photo ${i + 1}`}
                                  onClick={() => removeDraftAdditionalPhoto(i)}
                                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white shadow-md ring-1 ring-white/90 hover:bg-black/70"
                                >
                                  <Trash2
                                    className="h-3.5 w-3.5"
                                    strokeWidth={2.25}
                                  />
                                </button>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Upload interior shots, product displays, etc. Up to 4
                      photos.
                      {(draftStore.additionalPhotoNames || []).length ? (
                        <span className="ml-1 font-semibold text-emerald-600">
                          ({(draftStore.additionalPhotoNames || []).length}
                          /4)
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  {renderStoreCfgDeliveryZoneIcon()}
                  <p className="text-base font-bold text-violet-900">
                    Delivery Zone
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      setDraftStore((p) => ({
                        ...p,
                        deliveryZoneType: 'pan-india',
                      }))
                    }
                    className={`w-full rounded-xl border-2 p-3 text-left transition ${
                      draftStore.deliveryZoneType === 'pan-india'
                        ? 'border-violet-600 bg-violet-50 shadow-md ring-1 ring-violet-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          draftStore.deliveryZoneType === 'pan-india'
                            ? 'border-violet-600'
                            : 'border-gray-300'
                        }`}
                        aria-hidden
                      >
                        {draftStore.deliveryZoneType === 'pan-india' ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                        ) : null}
                      </span>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Globe
                          className="h-5 w-5 text-slate-700"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          Pan-India (Standard Shipping)
                        </p>
                        <p className="text-xs text-gray-500">
                          Ship to any location across India
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftStore((p) => ({
                        ...p,
                        deliveryZoneType: 'hyper-local',
                      }))
                    }
                    className={`w-full rounded-xl border-2 p-3 text-left transition ${
                      draftStore.deliveryZoneType === 'hyper-local'
                        ? 'border-violet-600 bg-violet-50 shadow-md ring-1 ring-violet-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          draftStore.deliveryZoneType === 'hyper-local'
                            ? 'border-violet-600'
                            : 'border-gray-300'
                        }`}
                        aria-hidden
                      >
                        {draftStore.deliveryZoneType === 'hyper-local' ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                        ) : null}
                      </span>
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          draftStore.deliveryZoneType === 'hyper-local'
                            ? 'bg-violet-100'
                            : 'bg-slate-100'
                        }`}
                      >
                        <MapPinned
                          className={`h-5 w-5 ${
                            draftStore.deliveryZoneType === 'hyper-local'
                              ? 'text-violet-700'
                              : 'text-slate-700'
                          }`}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          Hyper-local (Define Radius)
                        </p>
                        <p className="text-xs text-gray-500">
                          Deliver within a specific radius from this store
                        </p>
                      </div>
                    </div>
                  </button>
                  {draftStore.deliveryZoneType === 'hyper-local' ? (
                    <div className="rounded-xl border border-violet-200 bg-white p-3">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                        <span>Service Radius:</span>
                        <span className="text-sm font-bold text-violet-700">
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
                        className="mt-2 w-full accent-violet-600"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                        <span>0 km</span>
                        <span>25 km</span>
                        <span>50 km</span>
                      </div>
                      <div className="relative mt-3 overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-white px-3 py-8 text-center">
                        <div
                          className="pointer-events-none absolute inset-0 opacity-40"
                          style={{
                            backgroundImage:
                              'linear-gradient(#e9d5ff 1px, transparent 1px), linear-gradient(90deg, #e9d5ff 1px, transparent 1px)',
                            backgroundSize: '18px 18px',
                          }}
                          aria-hidden
                        />
                        <MapPin
                          className="relative mx-auto h-8 w-8 text-violet-600"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <p className="relative mt-2 text-xs font-medium text-gray-600">
                          Coverage Map Preview
                        </p>
                        <p className="relative mt-1 text-xs text-gray-700">
                          This store will deliver within{' '}
                          {draftStore.serviceRadiusKm} km radius
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  {renderStoreCfgCustomerWalkIcon()}
                  <p className="text-sm font-bold text-gray-900">
                    Customer Walk-in
                  </p>
                </div>
                <div className="space-y-3 rounded-xl border border-emerald-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Allow Walk-in Customers?
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
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
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                        draftStore.allowsWalkIn
                          ? 'bg-emerald-500'
                          : 'bg-gray-300'
                      }`}
                      aria-label="Toggle walk-in customers"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          draftStore.allowsWalkIn
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-gray-900">
                      Store Timings
                    </p>
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
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={draftStore.isDefault}
                      onChange={(e) =>
                        setDraftStore((p) => ({
                          ...p,
                          isDefault: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Mark as Default Store
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800 sm:justify-self-end">
                    <input
                      type="checkbox"
                      checked={draftStore.isActive}
                      onChange={(e) =>
                        setDraftStore((p) => ({
                          ...p,
                          isActive: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Active Store
                  </label>
                </div>
              </div>
              {!storeModalSaveCheck.ok ? (
                <p
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                  role="alert"
                >
                  {storeModalSaveCheck.message}
                </p>
              ) : null}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={addStore}
                  disabled={!storeModalSaveCheck.ok}
                  title={
                    storeModalSaveCheck.ok
                      ? undefined
                      : storeModalSaveCheck.message
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  <img
                    src={
                      typeof saveStoreIcon === 'string'
                        ? saveStoreIcon
                        : saveStoreIcon.src
                    }
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 shrink-0 object-contain"
                    aria-hidden
                  />
                  Save Store
                </button>
                <button
                  type="button"
                  onClick={closeStoreModal}
                  className="shrink-0 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-900 shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      ) : null}

      {storeDeleteConfirmIdx !== null ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
          onClick={() => setStoreDeleteConfirmIdx(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-delete-title"
          >
            <h3
              id="store-delete-title"
              className="text-lg font-semibold text-gray-900"
            >
              Remove store?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will remove{' '}
              <span className="font-semibold text-gray-900">
                {form.stores[storeDeleteConfirmIdx]?.storeName?.trim() ||
                  'this store'}
              </span>{' '}
              from your locations. You can add it again later with Add New
              Store.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStoreDeleteConfirmIdx(null)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePendingStore}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete store
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMapModalOpen ? (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                Select Store Location
              </h4>
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
                <p className="text-sm text-gray-500">
                  Search and choose a location.
                </p>
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
