// import mongoose from 'mongoose';

// const productSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   pricePerDay: { type: Number, required: true },
//   category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
//   brand: { type: String, default: '' },
//   condition: { type: String, enum: ['new', 'like-new', 'good', 'fair'], default: 'good' },
//   availability: { type: String, enum: ['available', 'unavailable'], default: 'available' },
//   images: [{ type: String }]
// }, { timestamps: true });

// export default mongoose.model('Product', productSchema);

import mongoose from 'mongoose';

const vendorRentalTierSchema = new mongoose.Schema(
  {
    months: { type: Number, default: 1 },
    days: { type: Number, default: 0 },
    periodUnit: {
      type: String,
      enum: ['month', 'day'],
      default: 'month',
    },
    label: { type: String, default: '' },
    pricePerDay: { type: Number, default: 0 },
    /** Monthly rent shown to customer (optional; falls back to pricePerDay-derived UI). */
    customerRent: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
  },
  { _id: false },
);

const productVariantSchema = new mongoose.Schema(
  {
    variantName: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '' },
    storage: { type: String, trim: true, default: '' },
    ram: { type: String, trim: true, default: '' },
    condition: { type: String, trim: true, default: '' },
    price: { type: String, trim: true, default: '' },
    stock: { type: Number, default: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },

    price: {
      type: String, // "1499/month"
      required: true,
    },

    type: {
      type: String,
      enum: ['Rental', 'Sell'],
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    subCategory: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      default: '',
    },
    condition: {
      type: String,
      enum: ['Brand New', 'Like New', 'Good', 'Fair'],
      default: 'Good',
    },
    shortDescription: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    variants: {
      type: [productVariantSchema],
      default: [],
    },
    rentalConfigurations: {
      type: [vendorRentalTierSchema],
      default: [],
    },
    refundableDeposit: {
      type: Number,
      default: 0,
    },
    logisticsVerification: {
      type: {
        inventoryOwnerName: { type: String, default: '' },
        city: { type: String, default: '' },
        deliveryTimelineValue: { type: Number, default: 0 },
        deliveryTimelineUnit: { type: String, default: 'Days' },
      },
      default: {},
    },

    /** Vendor listing workflow (separate from stock status). */
    submissionStatus: {
      type: String,
      enum: ['draft', 'pending_approval', 'published'],
      default: 'published',
    },

    stock: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Low Stock', 'Out of Stock'],
      default: 'Active',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Product', productSchema);
