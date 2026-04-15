import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  /** Snapshot of product listing type at order time (Rental | Sell). */
  productType: { type: String, enum: ['Rental', 'Sell'], default: 'Rental' },
  quantity: { type: Number, required: true, default: 1 },
  pricePerDay: { type: Number, required: true },
  /** Snapshot: total refundable deposit for this line (per-unit deposit × quantity). */
  refundableDeposit: { type: Number, default: 0 },
  /** Customer-side return request + review for this specific rented line item. */
  returnRequest: {
    status: {
      type: String,
      enum: ['none', 'requested', 'review_submitted'],
      default: 'none',
    },
    pickupDate: { type: Date },
    vendorPickupDate: { type: Date },
    vendorPickupTime: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening'],
    },
    vendorPickupAddress: { type: String, default: '' },
    vendorDriverName: { type: String, default: '' },
    pickupScheduledAt: { type: Date },
    inspectionChecklist: {
      powerFunctionCheck: { type: Boolean, default: true },
      surfaceScratches: { type: Boolean, default: false },
      structuralIntegrity: { type: Boolean, default: true },
      accessoriesAccountedFor: { type: Boolean, default: true },
      cleanlinessCheck: { type: Boolean, default: true },
    },
    pickupPhotoName: { type: String, default: '' },
    qcCompletedAt: { type: Date },
    damageDeduction: { type: Number, default: 0 },
    cleaningFees: { type: Number, default: 0 },
    totalDeduction: { type: Number, default: 0 },
    finalRefundAmount: { type: Number, default: 0 },
    refundInitiatedAt: { type: Date },
    refundMethod: {
      type: String,
      enum: ['original', 'upi', 'bank'],
    },
    refundDetails: {
      upiId: { type: String, default: '' },
      bankAccountName: { type: String, default: '' },
      bankAccountNumber: { type: String, default: '' },
      bankIfsc: { type: String, default: '' },
    },
    rating: { type: Number, min: 1, max: 5 },
    reviewText: { type: String, default: '' },
    mediaNames: [{ type: String }],
    media: [
      {
        url: { type: String, default: '' },
        type: { type: String, default: '' },
        name: { type: String, default: '' },
      },
    ],
    requestedAt: { type: Date },
    reviewedAt: { type: Date },
  },
});

/** Vendor packing + delivery handoff (saved when order is marked shipped). */
const vendorFulfillmentSchema = new mongoose.Schema(
  {
    packingChecklist: {
      verifyQuality: { type: Boolean, default: false },
      packSecurely: { type: Boolean, default: false },
      labelPasted: { type: Boolean, default: false },
    },
    markedPackedAt: { type: Date },
    delivery: {
      method: {
        type: String,
        enum: ['self', 'third_party'],
        default: 'self',
      },
      driverName: { type: String, default: '' },
      driverPhone: { type: String, default: '' },
      vehicleNumber: { type: String, default: '' },
      markedShippedAt: { type: Date },
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [orderItemSchema],
  rentalDuration: { type: Number, required: true },
  /** Initial checkout tenure before any extension updates. */
  originalRentalDuration: { type: Number },
  /** Sum of all tenure increments applied via extend endpoint. */
  extendedDurationTotal: { type: Number, default: 0 },
  /** How `rentalDuration` is interpreted: calendar months vs day count (matches cart / checkout). */
  tenureUnit: {
    type: String,
    enum: ['month', 'day'],
  },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled'],
    default: 'pending',
  },
  vendorFulfillment: { type: vendorFulfillmentSchema },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
