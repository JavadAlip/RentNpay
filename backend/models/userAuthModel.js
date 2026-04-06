// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema(
//   {
//     fullName: {
//       type: String,
//       required: true,
//     },
//     emailAddress: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     otp: String,
//     otpExpire: Date,
//   },
//   { timestamps: true },
// );

// export default mongoose.model('User', userSchema);

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    emailAddress: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpire: {
      type: Date,
      default: null,
    },

    /** Stable platform customer id for admin Users table (CUST-001). */
    customerNumber: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ emailAddress: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
