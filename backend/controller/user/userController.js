import User from '../../models/userAuthModel.js';
import Counter from '../../models/Counter.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../../utils/sendMail.js';

// ✅ Signup
export const signupUser = async (req, res) => {
  try {
    const { fullName, emailAddress, password } = req.body;

    const existing = await User.findOne({ emailAddress });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

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

    await sendOTPEmail(emailAddress, otp);

    res.status(201).json({
      message: 'Signup successful, OTP sent to email',
    });
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

    if (user.otp !== otp || user.otpExpire < Date.now()) {
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
