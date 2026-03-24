import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 95,
    },
    sticker: {
      type: String,
      default: '',
      trim: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

offerSchema.index({ vendorId: 1, productId: 1 }, { unique: true });

export default mongoose.model('Offer', offerSchema);

