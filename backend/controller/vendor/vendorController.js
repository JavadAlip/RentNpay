import Vendor from '../../models/vendorAuthModel.js';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '../../utils/sendMail.js';
import jwt from 'jsonwebtoken';

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
