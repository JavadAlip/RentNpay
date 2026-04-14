import Vendor from '../../models/vendorAuthModel.js';
import bcrypt from 'bcryptjs';
import { sendVendorOtpEmail } from '../../utils/sendMail.js';
import jwt from 'jsonwebtoken';
import Product from '../../models/Product.js';
import Offer from '../../models/Offer.js';
import VendorKyc from '../../models/VendorKyc.js';

const normalizeMobileDigits = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.length > 10 ? digits.slice(-10) : digits;
  }
  return digits;
};

/** Same as brevo-test + forgot-password: one canonical email per account. */
const normalizeEmail = (raw) => String(raw || '').trim().toLowerCase();

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isTruthy = (value) =>
  ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

const isVendorOtpBypassEnabled = () =>
  isTruthy(
    process.env.VENDOR_OTP_BYPASS_ENABLED || process.env.OTP_BYPASS_ENABLED,
  );

const getVendorDummyOtp = () => {
  const envOtp = String(
    process.env.VENDOR_DUMMY_OTP || process.env.DUMMY_OTP || '',
  ).trim();
  return /^\d{6}$/.test(envOtp) ? envOtp : '123456';
};

const shouldExposeSignupOtp = () =>
  isTruthy(
    process.env.VENDOR_SIGNUP_EXPOSE_OTP || process.env.EXPOSE_SIGNUP_OTP,
  );

const shouldSkipVendorOtpEmail = () =>
  isTruthy(
    process.env.VENDOR_SKIP_OTP_EMAIL || process.env.SKIP_VENDOR_OTP_EMAIL,
  );

const shouldExposeResetOtp = () =>
  isTruthy(process.env.VENDOR_RESET_EXPOSE_OTP || process.env.EXPOSE_RESET_OTP);

/** Finds vendor by normalized email, with case-insensitive fallback for legacy rows. */
const findVendorByEmail = async (raw) => {
  const email = normalizeEmail(raw);
  if (!email) return null;
  let v = await Vendor.findOne({ emailAddress: email });
  if (v) return v;
  return Vendor.findOne({
    emailAddress: { $regex: new RegExp(`^${escapeRegExp(email)}$`, 'i') },
  });
};

export const signupVendor = async (req, res) => {
  try {
    const { fullName, emailAddress, password, mobileNumber, referralCode } = req.body;

    const email = normalizeEmail(emailAddress);
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const mobile = normalizeMobileDigits(mobileNumber);
    if (!mobile || mobile.length < 10) {
      return res.status(400).json({
        message: 'Valid mobile number is required (at least 10 digits)',
      });
    }

    const existing = await findVendorByEmail(emailAddress);
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingMobile = await Vendor.findOne({ mobileNumber: mobile });
    if (existingMobile) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const bypassEnabled = isVendorOtpBypassEnabled();
    const otp = bypassEnabled
      ? getVendorDummyOtp()
      : Math.floor(100000 + Math.random() * 900000).toString();

    const ref = String(referralCode || '').trim().slice(0, 64);

    const vendor = new Vendor({
      fullName: String(fullName || '').trim(),
      emailAddress: email,
      password: hashedPassword,
      mobileNumber: mobile,
      referralCode: ref,
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000, // 5 mins
    });

    await vendor.save();

    const skipOtpEmail = shouldSkipVendorOtpEmail();
    if (!bypassEnabled && !skipOtpEmail) {
      await sendVendorOtpEmail(email, otp);
    }

    const exposeOtp = bypassEnabled || shouldExposeSignupOtp();
    const payload = {
      message:
        bypassEnabled || skipOtpEmail
          ? 'Signup successful, use test OTP to verify account'
          : 'Signup successful, OTP sent to email',
    };
    if (exposeOtp) {
      payload.testOtp = otp;
    }

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { emailAddress, otp } = req.body;
    const email = normalizeEmail(emailAddress);
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const vendor = await findVendorByEmail(emailAddress);

    if (!vendor) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enteredOtp = String(otp || '').trim();
    const bypassEnabled = isVendorOtpBypassEnabled();
    const bypassOtp = getVendorDummyOtp();
    const isBypassMatch = bypassEnabled && enteredOtp === bypassOtp;
    const isStoredOtpMatch =
      String(vendor.otp || '') === enteredOtp &&
      vendor.otpExpire &&
      vendor.otpExpire >= Date.now();

    if (!isBypassMatch && !isStoredOtpMatch) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    vendor.isVerified = true;
    vendor.otp = null;
    vendor.otpExpire = null;
    vendor.emailAddress = email;

    await vendor.save();

    const token = jwt.sign(
      { vendorId: vendor._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      message: 'Account verified successfully',
      token,
      vendor: {
        id: vendor._id,
        fullName: vendor.fullName,
        emailAddress: vendor.emailAddress,
        mobileNumber: vendor.mobileNumber || '',
        referralCode: vendor.referralCode || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginVendor = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    const email = normalizeEmail(emailAddress);
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const vendor = await findVendorByEmail(emailAddress);

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
        mobileNumber: vendor.mobileNumber || '',
        referralCode: vendor.referralCode || '',
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

    const email = normalizeEmail(emailAddress);
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const vendor = await findVendorByEmail(emailAddress);

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

    const skipOtpEmail = shouldSkipVendorOtpEmail();
    if (!skipOtpEmail) {
      await sendVendorOtpEmail(vendor.emailAddress, otp);
    }

    const payload = {
      message: skipOtpEmail
        ? 'OTP generated for testing.'
        : 'If this email exists, an OTP has been sent.',
    };
    if (shouldExposeResetOtp()) {
      payload.testOtp = otp;
    }
    return res.json(payload);
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

    const vendor = await findVendorByEmail(emailAddress);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    if (
      String(vendor.otp) !== String(otp).trim() ||
      !vendor.otpExpire ||
      vendor.otpExpire < Date.now()
    ) {
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

    const vendor = await findVendorByEmail(emailAddress);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    if (
      String(vendor.otp) !== String(otp).trim() ||
      !vendor.otpExpire ||
      vendor.otpExpire < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    vendor.emailAddress = normalizeEmail(vendor.emailAddress);
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
