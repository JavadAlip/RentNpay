import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    emailAddress: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      default: '',
      trim: true,
    },
    referralCode: {
      type: String,
      default: '',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpire: Date,
  },
  { timestamps: true },
);

export default mongoose.model('Vendor', vendorSchema);
