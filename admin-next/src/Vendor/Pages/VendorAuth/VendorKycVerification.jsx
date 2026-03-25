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
};

export default function VendorKycVerification() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

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
      setForm((prev) => ({ ...prev, [name]: files[0] || null }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('fullName', form.fullName);
      payload.append('dateOfBirth', form.dateOfBirth);
      payload.append('permanentAddress', form.permanentAddress);
      payload.append('contactNumber', form.contactNumber);
      payload.append('panNumber', form.panNumber);
      payload.append('aadhaarNumber', form.aadhaarNumber);
      payload.append('tshirtSize', form.tshirtSize);
      payload.append('jeansWaistSize', form.jeansWaistSize);
      payload.append('shoeSize', form.shoeSize);
      if (form.ownerPhoto) payload.append('ownerPhoto', form.ownerPhoto);
      if (form.panPhoto) payload.append('panPhoto', form.panPhoto);
      if (form.aadhaarFront) payload.append('aadhaarFront', form.aadhaarFront);
      if (form.aadhaarBack) payload.append('aadhaarBack', form.aadhaarBack);

      await apiSubmitVendorKyc(payload, token);
      window.location.href = '/vendor-dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSaving(false);
    }
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
          <p className="text-sm text-gray-500">Step 1 of 4: Proprietor Information</p>
          {status ? (
            <p className="mt-2 text-xs text-gray-600">
              Current KYC Status:{' '}
              <span className="font-semibold capitalize">{status}</span>
            </p>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-6"
        >
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Owner&apos;s Photo</h2>
            <input
              type="file"
              name="ownerPhoto"
              accept="image/*"
              onChange={handleChange}
              className="w-full text-sm"
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <textarea
              name="permanentAddress"
              value={form.permanentAddress}
              onChange={handleChange}
              placeholder="Permanent Address"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm min-h-24"
              required
            />
            <input
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              placeholder="Contact Number"
              className="w-full md:w-1/2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              required
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Identity Proofs (KYC Documents)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="panNumber"
                value={form.panNumber}
                onChange={handleChange}
                placeholder="PAN Card Number"
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                name="aadhaarNumber"
                value={form.aadhaarNumber}
                onChange={handleChange}
                placeholder="Aadhaar Card Number"
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="file"
                name="panPhoto"
                accept="image/*"
                onChange={handleChange}
                className="w-full text-sm"
              />
              <input
                type="file"
                name="aadhaarFront"
                accept="image/*"
                onChange={handleChange}
                className="w-full text-sm"
              />
              <input
                type="file"
                name="aadhaarBack"
                accept="image/*"
                onChange={handleChange}
                className="w-full text-sm"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Personalize your Welcome Kit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                name="tshirtSize"
                value={form.tshirtSize}
                onChange={handleChange}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">T-Shirt Size</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
              </select>
              <select
                name="jeansWaistSize"
                value={form.jeansWaistSize}
                onChange={handleChange}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Jeans/Waist Size</option>
                <option>30</option>
                <option>32</option>
                <option>34</option>
                <option>36</option>
              </select>
              <select
                name="shoeSize"
                value={form.shoeSize}
                onChange={handleChange}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Shoe Size</option>
                <option>7</option>
                <option>8</option>
                <option>9</option>
                <option>10</option>
              </select>
            </div>
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

