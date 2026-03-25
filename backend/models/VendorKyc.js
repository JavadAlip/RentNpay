import mongoose from 'mongoose';

const vendorKycSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true,
      index: true,
    },
    ownerPhoto: { type: String, default: '' },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    permanentAddress: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    panNumber: { type: String, required: true, trim: true, uppercase: true },
    aadhaarNumber: { type: String, required: true, trim: true },
    panPhoto: { type: String, default: '' },
    aadhaarFront: { type: String, default: '' },
    aadhaarBack: { type: String, default: '' },
    tshirtSize: { type: String, default: '' },
    jeansWaistSize: { type: String, default: '' },
    shoeSize: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    adminComment: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model('VendorKyc', vendorKycSchema);

