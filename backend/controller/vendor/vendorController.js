import Vendor from '../../models/vendorAuthModel.js';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '../../utils/sendMail.js';
import jwt from 'jsonwebtoken';
import Product from '../../models/Product.js';
import Offer from '../../models/Offer.js';
import VendorKyc from '../../models/VendorKyc.js';

export const signupVendor = async (req, res) => {
  try {
    const { fullName, emailAddress, password } = req.body;

    const existing = await Vendor.findOne({ emailAddress });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const vendor = new Vendor({
      fullName,
      emailAddress,
      password: hashedPassword,
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000, // 5 mins
    });

    await vendor.save();

    await sendOTPEmail(emailAddress, otp);

    res.status(201).json({
      message: 'Signup successful, OTP sent to email',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { emailAddress, otp } = req.body;

    const vendor = await Vendor.findOne({ emailAddress });

    if (!vendor) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (vendor.otp !== otp || vendor.otpExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    vendor.isVerified = true;
    vendor.otp = null;
    vendor.otpExpire = null;

    await vendor.save();

    res.json({ message: 'Account verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginVendor = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    const vendor = await Vendor.findOne({ emailAddress });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (!vendor.isVerified) {
      return res.status(400).json({ message: 'Please verify your account' });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ✅ IMPORTANT CHANGE HERE
    const token = jwt.sign(
      { vendorId: vendor._id }, // 👈 must match middleware
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      message: 'Login successful',
      token,
      vendor: {
        id: vendor._id,
        fullName: vendor.fullName,
        emailAddress: vendor.emailAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotVendorPassword = async (req, res) => {
  try {
    const { emailAddress } = req.body;
    if (!emailAddress) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const vendor = await Vendor.findOne({
      emailAddress: String(emailAddress).trim().toLowerCase(),
    });

    // Keep response generic to avoid email enumeration.
    if (!vendor) {
      return res.json({
        message: 'If this email exists, an OTP has been sent.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    vendor.otp = otp;
    vendor.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await vendor.save();

    await sendOTPEmail(vendor.emailAddress, otp);

    return res.json({
      message: 'If this email exists, an OTP has been sent.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyVendorResetOtp = async (req, res) => {
  try {
    const { emailAddress, otp } = req.body;
    if (!emailAddress || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const vendor = await Vendor.findOne({
      emailAddress: String(emailAddress).trim().toLowerCase(),
    });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    if (vendor.otp !== otp || !vendor.otpExpire || vendor.otpExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    return res.json({ message: 'OTP verified' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const resetVendorPassword = async (req, res) => {
  try {
    const { emailAddress, otp, newPassword } = req.body;
    if (!emailAddress || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Email, OTP and newPassword are required' });
    }
    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ message: 'New password must be at least 6 characters' });
    }

    const vendor = await Vendor.findOne({
      emailAddress: String(emailAddress).trim().toLowerCase(),
    });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    if (vendor.otp !== otp || !vendor.otpExpire || vendor.otpExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    vendor.password = await bcrypt.hash(String(newPassword), 10);
    vendor.otp = null;
    vendor.otpExpire = null;
    await vendor.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const vendorLogout = async (req, res) => {
  try {
    console.log('Vendor Logout API Hit');

    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    return res.status(200).json({
      message: 'Vendor logged out successfully',
    });
  } catch (error) {
    console.error('Vendor logout error:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};

// ✅ Get All Vendors
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().select('-password -otp -otpExpire');

    res.status(200).json({
      message: 'All vendors fetched successfully',
      vendors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete Vendor
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Cascade delete vendor-owned resources so products/offers won't show as "Unknown Vendor"
    await Promise.all([
      Product.deleteMany({ vendorId: id }),
      Offer.deleteMany({ vendorId: id }),
      VendorKyc.deleteMany({ vendorId: id }),
    ]);

    await Vendor.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
