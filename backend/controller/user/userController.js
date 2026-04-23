import User from '../../models/userAuthModel.js';
import Counter from '../../models/Counter.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../../utils/sendMail.js';

const isTruthy = (value) =>
  ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

/** Same pattern as vendor signup: dev bypass + optional expose in JSON. */
const isUserOtpBypassEnabled = () =>
  isTruthy(
    process.env.USER_OTP_BYPASS_ENABLED || process.env.OTP_BYPASS_ENABLED,
  );

const getUserDummyOtp = () => {
  const envOtp = String(
    process.env.USER_DUMMY_OTP || process.env.DUMMY_OTP || '',
  ).trim();
  return /^\d{6}$/.test(envOtp) ? envOtp : '123456';
};

const shouldExposeUserSignupOtp = () =>
  isTruthy(
    process.env.USER_SIGNUP_EXPOSE_OTP || process.env.EXPOSE_SIGNUP_OTP,
  );

const shouldSkipUserOtpEmail = () =>
  isTruthy(process.env.SKIP_USER_OTP_EMAIL || process.env.SKIP_OTP_EMAIL);

// ✅ Signup
export const signupUser = async (req, res) => {
  try {
    const { fullName, emailAddress, password } = req.body;

    const existing = await User.findOne({ emailAddress });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const bypassEnabled = isUserOtpBypassEnabled();
    const otp = bypassEnabled
      ? getUserDummyOtp()
      : Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      fullName,
      emailAddress,
      password: hashedPassword,
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000,
    });

    await user.save();

    const c = await Counter.findByIdAndUpdate(
      'userCustomerSeq',
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    await User.updateOne({ _id: user._id }, { $set: { customerNumber: c.seq } });

    const skipOtpEmail = shouldSkipUserOtpEmail();
    if (!bypassEnabled && !skipOtpEmail) {
      await sendOTPEmail(emailAddress, otp);
    }

    const exposeOtp = bypassEnabled || shouldExposeUserSignupOtp();
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

// ✅ Verify OTP
export const verifyUserOTP = async (req, res) => {
  try {
    const { emailAddress, otp } = req.body;

    const user = await User.findOne({ emailAddress });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enteredOtp = String(otp || '').trim();
    const bypassEnabled = isUserOtpBypassEnabled();
    const bypassOtp = getUserDummyOtp();
    const isBypassMatch = bypassEnabled && enteredOtp === bypassOtp;
    const isStoredOtpMatch =
      String(user.otp || '') === enteredOtp &&
      user.otpExpire &&
      user.otpExpire >= Date.now();

    if (!isBypassMatch && !isStoredOtpMatch) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    res.json({ message: 'Account verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Login
export const loginUser = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    const user = await User.findOne({ emailAddress });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id }, // 👈 IMPORTANT (different from vendorId)
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Logout (optional)
export const userLogout = async (req, res) => {
  res.json({ message: 'User logged out successfully' });
};
