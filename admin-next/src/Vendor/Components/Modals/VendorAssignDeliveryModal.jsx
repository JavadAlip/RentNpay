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
  AlertCircle,
  CircleCheck,
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
      {/* <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200"
      > */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto 
  rounded-2xl bg-white shadow-2xl border border-gray-200
  [scrollbar-width:none] [-ms-overflow-style:none] 
  [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Assign delivery partner
            </h2>
            {/* <p className="text-sm text-gray-500 mt-0.5">
              For order #{orderRef} ({customerShort})
            </p> */}
            <p className="text-sm text-gray-500 mt-0.5">
              For order{' '}
              <span className="font-semibold text-black">#{orderRef}</span> (
              {customerShort})
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
              Who is delivering? <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* <button
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
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900 text-sm">
                    Self / staff
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 pl-6">
                  Your own delivery person or staff member.
                </p>
              </button> */}
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
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      method === 'self'
                        ? 'bg-[#F97316] text-white'
                        : 'bg-[#F3F4F6] text-[#64748B]'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </span>

                  <span className="font-semibold text-gray-900 text-sm">
                    Self / staff
                  </span>

                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ml-auto flex items-center justify-center ${
                      method === 'self' ? 'border-[#F97316]' : 'border-gray-300'
                    }`}
                  >
                    {method === 'self' && (
                      <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                    )}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1.5 pl-9">
                  Your own delivery person or staff member.
                </p>
              </button>
              {/* <button
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
              </button> */}
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
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      method === 'third_party'
                        ? 'bg-[#F97316] text-white'
                        : 'bg-[#F3F4F6] text-[#64748B]'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </span>

                  <span className="font-semibold text-gray-900 text-sm">
                    3rd party
                  </span>

                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ml-auto flex items-center justify-center ${
                      method === 'third_party'
                        ? 'border-[#F97316]'
                        : 'border-gray-300'
                    }`}
                  >
                    {method === 'third_party' && (
                      <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                    )}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1.5 pl-9">
                  Porter, Dunzo, or other delivery service.
                </p>
              </button>
            </div>
          </div>

          {method === 'self' ? (
            // <div className="space-y-3">
            //   <div>
            //     <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            //       <User className="w-3.5 h-3.5" />
            //       Driver / staff name <span className="text-red-500">*</span>
            //     </label>
            //     <input
            //       value={driverName}
            //       onChange={(e) => setDriverName(e.target.value)}
            //       placeholder="e.g. Ramesh Kumar"
            //       required
            //       className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            //     />
            //   </div>
            //   <div>
            //     <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            //       <Phone className="w-3.5 h-3.5" />
            //       Phone number <span className="text-red-500">*</span>
            //     </label>
            //     <input
            //       value={driverPhone}
            //       onChange={(e) => setDriverPhone(e.target.value)}
            //       placeholder="+91 98765 43210"
            //       required
            //       className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            //     />
            //     <p className="text-[11px] text-gray-400 mt-1">
            //       Shared with customer for delivery coordination.
            //     </p>
            //   </div>
            //   <div>
            //     <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            //       <Car className="w-3.5 h-3.5" />
            //       Vehicle number (optional)
            //     </label>
            //     <input
            //       value={vehicleNumber}
            //       onChange={(e) => setVehicleNumber(e.target.value)}
            //       placeholder="MH-12-AB-1234"
            //       className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            //     />
            //   </div>
            // </div>
            <div className="rounded-xl border border-gray-200 p-3 space-y-3">
              {/* row 1 */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#F97316]" />
                <h1 className="text-sm font-semibold">
                  Driver / Staff Details
                </h1>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    Driver / staff name <span className="text-red-500">*</span>
                  </label>
                  {/* <input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  /> */}
                  <div className="relative mt-1">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    {/* <Phone className="w-3.5 h-3.5" /> */}
                    Phone number <span className="text-red-500">*</span>
                  </label>
                  {/* <input
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  /> */}
                  <div className="relative mt-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Shared with customer for delivery coordination.
                  </p>
                </div>
              </div>

              {/* row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    {/* <Car className="w-3.5 h-3.5" /> */}
                    Vehicle number (optional)
                  </label>
                  {/* <input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="MH-12-AB-1234"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  /> */}
                  <div className="relative mt-1">
                    <Car className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="MH-12-AB-1234"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                </div>
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
            {/* <p className="text-xs font-bold text-amber-900 mb-2">
              Pre-dispatch checklist
            </p> */}
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              <p className="text-xs font-bold text-amber-900">
                Pre-dispatch checklist
              </p>
            </div>
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
            <CircleCheck className="w-4 h-4" />
          </button>
          {/* <div className="rounded-lg bg-[#F0FDF4] border border-[#B9F8CF] px-3 py-2 text-xs text-[#016630] flex items-start gap-2">
            <CircleCheck className="w-3.5 h-3.5 text-[#016630] shrink-0 mt-0.5" />
            <span>
              This will send an{' '}
              <span className="font-semibold">"Out for Delivery"</span> SMS to
              Customer with delivery details and tracking information.
            </span>
          </div> */}
          <div className="rounded-lg bg-[#F0FDF4] border border-[#B9F8CF] px-3 py-2 text-xs text-[#016630] flex items-start gap-2">
            <CircleCheck className="w-3.5 h-3.5 text-[#016630] shrink-0 mt-0.5" />
            <span>
              This will send an{' '}
              <span className="font-semibold">
                &quot;Out for Delivery&quot;
              </span>{' '}
              SMS to Customer with delivery details and tracking information.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
