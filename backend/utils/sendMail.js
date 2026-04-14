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

// ✅ OTP Email (user signup)
export const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: 'Your OTP Code',
    html: `<h2>Your OTP is: ${otp}</h2>`,
  });
};

/** Vendor signup / forgot-password OTP — uses same Gmail transporter as user OTP. */
export const sendVendorOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: 'Your OTP Code',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">Your OTP Code</h2>
        <p style="margin:0 0 10px">Use this OTP to continue:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:3px;margin:0 0 10px">${otp}</p>
        <p style="margin:0;color:#666">This OTP expires in a few minutes.</p>
      </div>
    `,
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
