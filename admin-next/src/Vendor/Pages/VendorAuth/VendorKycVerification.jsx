'use client';

import { useEffect, useState } from 'react';
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
  additionalPhotoNames: [],
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

export default function VendorKycVerification() {
  const [form, setForm] = useState(defaultForm);
  const [filePreviews, setFilePreviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [step, setStep] = useState(1);
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

    apiGetMyVendorKyc(token)
      .then((res) => {
        const kyc = res.data?.kyc;
        if (!kyc) return;
        setStatus(kyc.status || '');
        setStep(Number(kyc.currentStep || 1));
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
          secondaryContactNumber: kyc.businessDetails?.secondaryContactNumber || '',
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const f = files[0] || null;
      setForm((prev) => ({ ...prev, [name]: f }));
      if (f) {
        const isImage = String(f.type || '').startsWith('image/');
        const objectUrl = isImage ? URL.createObjectURL(f) : '';
        setFilePreviews((prev) => ({
          ...prev,
          [name]: {
            name: f.name,
            type: f.type || '',
            url: objectUrl,
            isImage,
          },
        }));
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
          <p className="text-[11px] text-gray-500 mt-1">Preview not available for this file type.</p>
        )}
      </div>
    );
  };

  const saveStep = async ({ targetStep, finalSubmit = false }) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('step', String(targetStep || step));
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
      payload.append('stores', JSON.stringify(form.stores || []));
      payload.append('slaAccepted', form.slaAccepted ? 'true' : 'false');
      payload.append(
        'commissionAccepted',
        form.commissionAccepted ? 'true' : 'false',
      );
      if (form.ownerPhoto) payload.append('ownerPhoto', form.ownerPhoto);
      if (form.panPhoto) payload.append('panPhoto', form.panPhoto);
      if (form.aadhaarFront) payload.append('aadhaarFront', form.aadhaarFront);
      if (form.aadhaarBack) payload.append('aadhaarBack', form.aadhaarBack);
      if (form.shopActLicense) payload.append('shopActLicense', form.shopActLicense);
      if (form.gstCertificate) payload.append('gstCertificate', form.gstCertificate);
      if (form.cancelledCheque) payload.append('cancelledCheque', form.cancelledCheque);

      // Upload store front photos as separate multipart fields.
      // Backend expects keys like: storeFront_0, storeFront_1, ...
      (form.stores || []).forEach((s, i) => {
        if (s.shopFrontPhotoFile instanceof File) {
          payload.append(`storeFront_${i}`, s.shopFrontPhotoFile);
        }
      });

      const res = await apiSubmitVendorKyc(payload, token);
      const nextStatus = res.data?.kyc?.status || '';
      if (nextStatus) setStatus(nextStatus);
      setForm((prev) => ({
        ...prev,
        stores: (prev.stores || []).map((s) => ({ ...s, shopFrontPhotoFile: null })),
      }));
      if (finalSubmit) {
        window.location.href = '/vendor-dashboard';
      } else {
        setStep(targetStep);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSaving(false);
    }
  };

  const addStore = () => {
    if (!draftStore.storeName.trim() || !draftStore.completeAddress.trim()) return;
    setForm((prev) => {
      if (editingStoreIdx >= 0) {
        return {
          ...prev,
          stores: prev.stores.map((s, i) => (i === editingStoreIdx ? draftStore : s)),
        };
      }
      return { ...prev, stores: [...prev.stores, draftStore] };
    });
    setDraftStore(emptyStore);
    setEditingStoreIdx(-1);
    setIsStoreModalOpen(false);
  };

  const onEditStore = (idx) => {
    setEditingStoreIdx(idx);
    setDraftStore({ ...emptyStore, ...(form.stores[idx] || {}) });
    setIsStoreModalOpen(true);
  };

  const onDeleteStore = (idx) => {
    setForm((prev) => ({
      ...prev,
      stores: prev.stores.filter((_, i) => i !== idx),
    }));
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
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Vendor KYC Verification</h1>
          <p className="text-sm text-gray-500">Step {step} of 4</p>
          {status ? (
            <p className="mt-2 text-xs text-gray-600">
              Current KYC Status:{' '}
              <span className="font-semibold capitalize">{status}</span>
            </p>
          ) : null}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {['Personal', 'Business', 'Banking', 'Store'].map((label, idx) => (
              <div
                key={label}
                className={`h-2 rounded-full ${idx + 1 <= step ? 'bg-orange-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          {step === 1 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Proprietor Information
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Tell us about the business owner for KYC verification
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4">
                <div>
                  <p className="text-base font-semibold text-gray-900">Owner&apos;s Photo</p>
                  <p className="text-xs text-gray-500">Upload a clear photo for profile verification</p>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                      {filePreviews.ownerPhoto?.isImage && filePreviews.ownerPhoto?.url ? (
                        <img
                          src={filePreviews.ownerPhoto.url}
                          alt="Owner preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl text-gray-400">👤</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="inline-block cursor-pointer">
                        <input
                          type="file"
                          name="ownerPhoto"
                          accept="image/*"
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          Upload Image
                        </span>
                      </label>
                      <p className="text-[11px] text-gray-500">
                        JPG or PNG - Max 3MB - Face clearly visible
                      </p>
                      {filePreviews.ownerPhoto?.name ? (
                        <p className="text-[11px] text-emerald-600 truncate max-w-xs">
                          Selected: {filePreviews.ownerPhoto.name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-base font-semibold text-gray-900">Personal Information</p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <textarea name="permanentAddress" value={form.permanentAddress} onChange={handleChange} placeholder="Address" className="mt-3 w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm min-h-20" />
                  <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Number" className="mt-3 w-full md:w-1/2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>

                <div>
                  <p className="text-base font-semibold text-gray-900">Identity Proofs (KYC Documents)</p>
                  <p className="text-xs text-gray-500">Upload government-issued ID cards for verification</p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input name="panNumber" value={form.panNumber} onChange={handleChange} placeholder="E.g. ABCDE1234F" className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    <input name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} placeholder="XXXX XXXX XXXX" className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block cursor-pointer"><input type="file" name="panPhoto" accept="image/*" onChange={handleChange} className="hidden" /><div className="h-20 border rounded-xl bg-gray-50 flex items-center justify-center text-xs text-gray-700">Upload PAN Card Photo</div></label>
                      {renderFilePreview('panPhoto')}
                    </div>
                    <div>
                      <label className="block cursor-pointer"><input type="file" name="aadhaarFront" accept="image/*" onChange={handleChange} className="hidden" /><div className="h-20 border rounded-xl bg-gray-50 flex items-center justify-center text-xs text-gray-700">Front</div></label>
                      {renderFilePreview('aadhaarFront')}
                    </div>
                    <div>
                      <label className="block cursor-pointer"><input type="file" name="aadhaarBack" accept="image/*" onChange={handleChange} className="hidden" /><div className="h-20 border rounded-xl bg-gray-50 flex items-center justify-center text-xs text-gray-700">Back</div></label>
                      {renderFilePreview('aadhaarBack')}
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                    Privacy: Your documents are encrypted and used only for KYC verification.
                  </div>
                </div>

                <div>
                  <p className="text-base font-semibold text-gray-900">Personalize your Welcome Kit</p>
                  <p className="text-xs text-gray-500">Select sizes for your free Rentnpay partner uniform</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select name="tshirtSize" value={form.tshirtSize} onChange={handleChange} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"><option value="">Select size</option><option>S</option><option>M</option><option>L</option><option>XL</option></select>
                    <select name="jeansWaistSize" value={form.jeansWaistSize} onChange={handleChange} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"><option value="">Select size</option><option>30</option><option>32</option><option>34</option><option>36</option></select>
                    <select name="shoeSize" value={form.shoeSize} onChange={handleChange} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"><option value="">Select size</option><option>7</option><option>8</option><option>9</option><option>10</option></select>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Tell us about your Business
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Provide your shop details and business documents for verification
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <p className="text-base font-semibold text-gray-900 mb-1">
                  Business Information
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Enter your business name and category
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Shop Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="shopName"
                      value={form.shopName}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Electronics"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Business Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="businessCategory"
                      value={form.businessCategory}
                      onChange={handleChange}
                      placeholder="Select category"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <p className="text-base font-semibold text-gray-900 mb-1">
                  Business Verification
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Provide your business registration documents
                </p>

                <div className="space-y-1 mb-3">
                  <label className="text-xs font-semibold text-gray-700">
                    Shop Act / MSME License Number{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="shopActNumber"
                    value={form.shopActNumber}
                    onChange={handleChange}
                    placeholder="e.g. SA/2025/12345 or MSME-001234"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-[11px] text-gray-500">
                    Enter your Shop Act registration or MSME certificate number
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-700">Shop Act License</p>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        name="shopActLicense"
                        accept="image/*,.pdf"
                        onChange={handleChange}
                        className="hidden"
                      />
                      <div className="h-24 rounded-xl border border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center px-3">
                        <p className="text-sm text-gray-700">Upload Document</p>
                        <p className="text-[11px] text-gray-500">PDF, JPG or PNG (Max 5MB)</p>
                      </div>
                    </label>
                    {renderFilePreview('shopActLicense')}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-700">
                      GST Certificate (Optional)
                    </p>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        name="gstCertificate"
                        accept="image/*,.pdf"
                        onChange={handleChange}
                        className="hidden"
                      />
                      <div className="h-24 rounded-xl border border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center px-3">
                        <p className="text-sm text-gray-700">Upload Document</p>
                        <p className="text-[11px] text-gray-500">PDF, JPG or PNG (Max 5MB)</p>
                      </div>
                    </label>
                    {renderFilePreview('gstCertificate')}
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <label className="text-xs font-semibold text-gray-700">
                    GSTIN <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    name="gstin"
                    value={form.gstin}
                    onChange={handleChange}
                    placeholder="E.G. 29ABCDE1234F1Z5"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-[11px] text-gray-500">
                    15-digit GST identification Number (if applicable)
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                  <p className="text-[11px] text-blue-700">
                    Note: At least one document is required. GST Certificate is mandatory
                    for businesses with annual turnover above ₹40 lakhs.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <p className="text-base font-semibold text-gray-900 mb-1">
                  Support Contacts
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Contact numbers for customer and admin support
                </p>

                <div className="space-y-1 mb-3">
                  <label className="text-xs font-semibold text-gray-700">
                    Primary Service Contact Number{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="primaryContactNumber"
                    value={form.primaryContactNumber}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-[11px] text-gray-500">
                    For customers to reach you regarding orders and services
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Secondary / Technical Support Contact{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="secondaryContactNumber"
                    value={form.secondaryContactNumber}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43211"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-[11px] text-gray-500">
                    For admin to reach you regarding platform and technical issues
                  </p>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-gray-200 p-4 sm:p-5 bg-white">
                <p className="text-base font-semibold text-gray-900 mb-4">
                  Bank Account Details
                </p>

                <div className="space-y-1 mb-3">
                  <label className="text-xs font-semibold text-gray-700">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="accountHolderName"
                    value={form.accountHolderName}
                    onChange={handleChange}
                    placeholder="As per bank records"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={handleChange}
                      placeholder="Enter account number"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Confirm Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="confirmAccountNumber"
                      value={form.confirmAccountNumber}
                      onChange={handleChange}
                      placeholder="Re-enter account number"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1 mb-1">
                  <label className="text-xs font-semibold text-gray-700">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="ifscCode"
                    value={form.ifscCode}
                    onChange={handleChange}
                    placeholder="E.g. SBIN0001234"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-[11px] text-gray-500">11-character bank branch code</p>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-700">
                    Upload Cancelled Cheque / Bank Passbook{' '}
                    <span className="text-red-500">*</span>
                  </p>
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      name="cancelledCheque"
                      accept="image/*,.pdf"
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div className="w-full min-h-24 rounded-xl border border-gray-300 bg-gray-50 flex items-center justify-center text-center px-4">
                      <div>
                        <p className="text-sm text-gray-700">
                          {form.cancelledCheque
                            ? form.cancelledCheque.name
                            : 'Click to upload cancelled cheque'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          PDF or JPG, Max 5MB
                        </p>
                      </div>
                    </div>
                  </label>
                  {renderFilePreview('cancelledCheque')}
                  <p className="text-[11px] text-gray-500">
                    For account verification, write &quot;CANCELLED&quot; across the cheque.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Secure &amp; Confidential: All your bank and financial information is
                    encrypted and stored securely. We will verify your details within
                    24-48 hours.
                  </p>
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Manage Stores</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStoreIdx(-1);
                    setDraftStore(emptyStore);
                    setIsStoreModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                >
                  + Add New Store
                </button>
              </div>
              <p className="text-xs text-gray-500">Configure your physical outlets and delivery zones.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[11px] text-gray-500">Total Stores</p>
                  <p className="text-xl font-semibold text-gray-900">{form.stores.length}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-[11px] text-gray-500">Active Stores</p>
                  <p className="text-xl font-semibold text-emerald-700">
                    {form.stores.filter((s) => s.isActive !== false).length}
                  </p>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-3">
                  <p className="text-[11px] text-gray-500">Physical Stores</p>
                  <p className="text-xl font-semibold text-gray-900">{form.stores.length}</p>
                </div>
              </div>
              <div className="space-y-2">
                {form.stores.length === 0 ? (
                  <p className="text-sm text-gray-500">No stores added yet.</p>
                ) : (
                  form.stores.map((s, i) => (
                    <div key={`${s.storeName}-${i}`} className="border rounded-xl p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {s.storeName || `Store ${i + 1}`}
                            {s.isDefault ? (
                              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">DEFAULT</span>
                            ) : null}
                            {s.isActive !== false ? (
                              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ACTIVE</span>
                            ) : null}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{s.completeAddress}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="border rounded-lg p-2">
                          <p className="text-[11px] text-gray-500">Service Mode</p>
                          <p className="text-xs mt-1">{s.serviceModeLocalDelivery ? 'Local Delivery' : 'No Local Delivery'}</p>
                          <p className="text-xs">{s.serviceModePanIndia ? 'Pan-India Shipping' : 'No Pan-India Shipping'}</p>
                        </div>
                        <div className="border rounded-lg p-2">
                          <p className="text-[11px] text-gray-500">Walk-in Access</p>
                          <p className="text-xs mt-1">{s.walkInAccessLabel || (s.allowsWalkIn ? 'Public Access' : 'No Public Access')}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" onClick={() => onEditStore(i)} className="px-3 py-1.5 rounded-lg border text-xs">Edit</button>
                        <button type="button" className="px-3 py-1.5 rounded-lg border text-xs bg-purple-50 border-purple-100 text-purple-700">Manage Inventory</button>
                        <button type="button" onClick={() => onDeleteStore(i)} className="ml-auto px-3 py-1.5 rounded-lg border text-xs text-red-600 border-red-200">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 space-y-2">
                <p className="text-sm font-medium text-gray-900">Terms & Commission</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.slaAccepted} onChange={(e) => setForm((p) => ({ ...p, slaAccepted: e.target.checked }))} />
                  I agree to the Rentnpay Service Level Agreement (SLA)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.commissionAccepted} onChange={(e) => setForm((p) => ({ ...p, commissionAccepted: e.target.checked }))} />
                  I accept the Platform Commission Policy on rentals
                </label>
              </div>
            </section>
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-between">
            <button type="button" disabled={saving || step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold disabled:opacity-50">Previous Step</button>
            {step < 4 ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => saveStep({ targetStep: step + 1 })}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            ) : (
              <button type="button" disabled={saving} onClick={() => saveStep({ targetStep: 4, finalSubmit: true })} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
                {saving ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>

      {isStoreModalOpen ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-4 space-y-4">
            <h3 className="text-lg font-semibold">
              {editingStoreIdx >= 0 ? 'Edit Store Settings' : 'Configure Store Settings'}
            </h3>
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-sm font-medium">Basic Information</p>
            <input value={draftStore.storeName} onChange={(e) => setDraftStore((p) => ({ ...p, storeName: e.target.value }))} placeholder="Store Name" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <textarea value={draftStore.completeAddress} onChange={(e) => setDraftStore((p) => ({ ...p, completeAddress: e.target.value }))} placeholder="Complete Address" className="w-full px-3 py-2 border rounded-lg text-sm min-h-20" />
            <input
              value={draftStore.pincode}
              onChange={(e) => setDraftStore((p) => ({ ...p, pincode: e.target.value }))}
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
                    setDraftStore((p) => ({ ...p, isDefault: e.target.checked }))
                  }
                />
                Mark as Default Store
              </label>
              <label className="flex items-center gap-2 text-sm justify-self-end">
                <input
                  type="checkbox"
                  checked={draftStore.isActive}
                  onChange={(e) =>
                    setDraftStore((p) => ({ ...p, isActive: e.target.checked }))
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
              <button type="button" onClick={addStore} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Save Store</button>
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

