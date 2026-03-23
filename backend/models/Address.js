import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: { type: String, default: 'Home' },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    area: { type: String, default: '' },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model('Address', addressSchema);

