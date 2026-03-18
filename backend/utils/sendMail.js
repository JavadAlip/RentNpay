import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Create transporter only once
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// ✅ OTP Email
export const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: 'Your OTP Code',
    html: `<h2>Your OTP is: ${otp}</h2>`,
  });
};

// ✅ General Email (optional)
export const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    text,
  });
};
