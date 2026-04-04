'use client';

import { useState } from 'react';
import {
  X,
  MapPin,
  User,
  Phone,
  Car,
  Send,
  CheckCircle2,
  Truck,
  UserCircle2,
} from 'lucide-react';

export default function VendorAssignDeliveryModal({
  open,
  onClose,
  orderRef,
  customerShort,
  deliveryLine,
  packingChecklist,
  submitting,
  onMarkShipped,
}) {
  const [method, setMethod] = useState('self');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onMarkShipped({
      method,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      vehicleNumber: vehicleNumber.trim(),
      packingChecklist,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Assign delivery partner
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              For order #{orderRef} ({customerShort})
            </p>
            <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#F97316]" />
              {deliveryLine}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Who is delivering?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('self')}
                className={`text-left rounded-xl border-2 p-3 transition-colors ${
                  method === 'self'
                    ? 'border-[#F97316] bg-orange-50/50 ring-1 ring-orange-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      method === 'self'
                        ? 'border-[#F97316] bg-[#F97316]'
                        : 'border-gray-300'
                    }`}
                  />
                  <UserCircle2 className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900 text-sm">
                    Self / staff
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 pl-6">
                  Your own delivery person or staff member.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMethod('third_party')}
                className={`text-left rounded-xl border-2 p-3 transition-colors ${
                  method === 'third_party'
                    ? 'border-[#F97316] bg-orange-50/50 ring-1 ring-orange-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      method === 'third_party'
                        ? 'border-[#F97316] bg-[#F97316]'
                        : 'border-gray-300'
                    }`}
                  />
                  <Truck className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900 text-sm">
                    3rd party
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 pl-6">
                  Porter, Dunzo, or other delivery service.
                </p>
              </button>
            </div>
          </div>

          {method === 'self' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Driver / staff name <span className="text-red-500">*</span>
                </label>
                <input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shared with customer for delivery coordination.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  Vehicle number (optional)
                </label>
                <input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="MH-12-AB-1234"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              Use a third-party partner to deliver. Add reference details in
              notes later if needed — for now you can mark shipped without
              driver fields.
            </p>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-3">
            <p className="text-xs font-bold text-amber-900 mb-2">
              Pre-dispatch checklist
            </p>
            <ul className="text-xs text-amber-900 space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                Ensure the item is packed securely.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                Tax invoice is attached to the package.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                Shipping label is pasted visibly.
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F97316] hover:bg-[#e56400] text-white text-sm font-semibold disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Updating…' : 'Mark as shipped'}
          </button>

          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-900">
            This will set the order to <strong>shipped</strong> and save delivery
            details. Customer sees out-for-delivery updates per your comms setup.
          </div>
        </form>
      </div>
    </div>
  );
}
