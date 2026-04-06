import mongoose from 'mongoose';

const userKycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    aadhaarFront: { type: String, default: '' },
    aadhaarBack: { type: String, default: '' },
    panCard: { type: String, default: '' },
    dateOfBirth: { type: Date, default: null },
    permanentAddress: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model('UserKyc', userKycSchema);
