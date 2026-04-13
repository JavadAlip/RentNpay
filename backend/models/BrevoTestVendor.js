import mongoose from 'mongoose';

const brevoTestVendorSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, required: true },
    emailAddress: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpire: { type: Date, default: null },
  },
  { timestamps: true },
);

const BrevoTestVendor =
  mongoose.models.BrevoTestVendor ||
  mongoose.model('BrevoTestVendor', brevoTestVendorSchema);

export default BrevoTestVendor;
