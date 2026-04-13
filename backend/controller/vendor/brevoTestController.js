import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import BrevoTestVendor from '../../models/BrevoTestVendor.js';
import { sendBrevoTestOtpEmail } from '../../utils/sendBrevoMail.js';

const BREVO_TEST_JWT_SECRET =
  process.env.BREVO_TEST_JWT_SECRET || process.env.JWT_SECRET || 'brevo-test-dev';

const makeOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const maskEmail = (email = '') => {
  const e = String(email || '').trim();
  const at = e.indexOf('@');
  if (at <= 1) return e;
  return `${e[0]}***${e.slice(at - 1)}`;
};

const signBrevoToken = (vendor) =>
  jwt.sign(
    {
      id: vendor._id,
      emailAddress: vendor.emailAddress,
      fullName: vendor.fullName,
      scope: 'brevo-test',
    },
    BREVO_TEST_JWT_SECRET,
    { expiresIn: '7d' },
  );

export const brevoTestRegister = async (req, res) => {
  const startedAt = Date.now();
  try {
    const { fullName, emailAddress, password } = req.body;
    if (!fullName || !emailAddress || !password) {
      return res
        .status(400)
        .json({ message: 'fullName, emailAddress and password are required.' });
    }
    const email = String(emailAddress).trim().toLowerCase();
    console.log('[BrevoTestRegister] start', {
      email: maskEmail(email),
      hasName: Boolean(fullName),
      hasPassword: Boolean(password),
    });
    const existing = await BrevoTestVendor.findOne({ emailAddress: email });
    const otp = makeOtp();
    const otpExpire = new Date(Date.now() + 5 * 60 * 1000);
    const passwordHash = await bcrypt.hash(String(password), 10);

    if (existing) {
      console.log('[BrevoTestRegister] existing user found, refreshing OTP', {
        email: maskEmail(email),
      });
      existing.fullName = String(fullName).trim();
      existing.password = passwordHash;
      existing.otp = otp;
      existing.otpExpire = otpExpire;
      existing.isVerified = false;
      await existing.save();
    } else {
      console.log('[BrevoTestRegister] creating new test vendor', {
        email: maskEmail(email),
      });
      await BrevoTestVendor.create({
        fullName: String(fullName).trim(),
        emailAddress: email,
        password: passwordHash,
        otp,
        otpExpire,
        isVerified: false,
      });
    }

    await sendBrevoTestOtpEmail(email, otp);
    console.log('[BrevoTestRegister] done', {
      email: maskEmail(email),
      elapsedMs: Date.now() - startedAt,
    });
    return res.status(200).json({
      message: 'OTP sent via Brevo. Check inbox/spam.',
      emailAddress: email,
    });
  } catch (error) {
    console.error('[BrevoTestRegister] failed', {
      elapsedMs: Date.now() - startedAt,
      code: error?.code,
      responseCode: error?.responseCode,
      message: error?.message,
    });
    return res.status(500).json({ message: error.message || 'Register failed' });
  }
};

export const brevoTestVerifyOtp = async (req, res) => {
  try {
    const { emailAddress, otp } = req.body;
    if (!emailAddress || !otp) {
      return res.status(400).json({ message: 'emailAddress and otp required.' });
    }
    const email = String(emailAddress).trim().toLowerCase();
    const vendor = await BrevoTestVendor.findOne({ emailAddress: email });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    if (!vendor.otp || !vendor.otpExpire || vendor.otpExpire < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Register again.' });
    }
    if (String(vendor.otp) !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    vendor.isVerified = true;
    vendor.otp = null;
    vendor.otpExpire = null;
    await vendor.save();
    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Verify failed' });
  }
};

export const brevoTestLogin = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    if (!emailAddress || !password) {
      return res
        .status(400)
        .json({ message: 'emailAddress and password required.' });
    }
    const email = String(emailAddress).trim().toLowerCase();
    const vendor = await BrevoTestVendor.findOne({ emailAddress: email });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    if (!vendor.isVerified) {
      return res.status(403).json({ message: 'Please verify OTP first.' });
    }
    const ok = await bcrypt.compare(String(password), vendor.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signBrevoToken(vendor);
    return res.status(200).json({
      message: 'Login successful.',
      token,
      vendor: {
        id: vendor._id,
        fullName: vendor.fullName,
        emailAddress: vendor.emailAddress,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
};

export const brevoTestMe = async (req, res) => {
  try {
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Token missing.' });
    const decoded = jwt.verify(token, BREVO_TEST_JWT_SECRET);
    if (decoded.scope !== 'brevo-test') {
      return res.status(403).json({ message: 'Invalid token scope.' });
    }
    const vendor = await BrevoTestVendor.findById(decoded.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    return res.status(200).json({
      vendor: {
        id: vendor._id,
        fullName: vendor.fullName,
        emailAddress: vendor.emailAddress,
        isVerified: vendor.isVerified,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
