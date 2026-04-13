import nodemailer from 'nodemailer';

const BREVO_HOST = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
const BREVO_PORT = Number(process.env.BREVO_SMTP_PORT || 587);
const BREVO_USER = process.env.BREVO_SMTP_USER || '';
const BREVO_PASS = process.env.BREVO_SMTP_PASS || '';
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || '';

let transporter = null;

const maskEmail = (email = '') => {
  const e = String(email || '').trim();
  const at = e.indexOf('@');
  if (at <= 1) return e;
  return `${e[0]}***${e.slice(at - 1)}`;
};

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: BREVO_HOST,
    port: BREVO_PORT,
    secure: BREVO_PORT === 465,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: BREVO_USER,
      pass: BREVO_PASS,
    },
  });
  return transporter;
};

const ensureBrevoEnv = () => {
  const missing = [];
  if (!BREVO_USER) missing.push('BREVO_SMTP_USER');
  if (!BREVO_PASS) missing.push('BREVO_SMTP_PASS');
  if (!BREVO_FROM_EMAIL) missing.push('BREVO_FROM_EMAIL');
  if (missing.length) {
    throw new Error(
      `Brevo SMTP env missing: ${missing.join(', ')}. Set these in backend env.`,
    );
  }
};

export const sendBrevoTestOtpEmail = async (toEmail, otp) => {
  ensureBrevoEnv();
  const startedAt = Date.now();
  const t = getTransporter();
  console.log('[BrevoTestMail] send start', {
    to: maskEmail(toEmail),
    host: BREVO_HOST,
    port: BREVO_PORT,
  });
  try {
    const info = await t.sendMail({
      from: BREVO_FROM_EMAIL,
      to: toEmail,
      subject: 'Brevo Test OTP - RentNPay',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 8px">Brevo OTP Verification</h2>
          <p style="margin:0 0 10px">Your OTP is:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:3px;margin:0 0 10px">${otp}</p>
          <p style="margin:0;color:#666">This OTP expires in 5 minutes.</p>
        </div>
      `,
    });
    console.log('[BrevoTestMail] send success', {
      to: maskEmail(toEmail),
      messageId: info?.messageId,
      accepted: info?.accepted?.length || 0,
      rejected: info?.rejected?.length || 0,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[BrevoTestMail] send failed', {
      to: maskEmail(toEmail),
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
      response: error?.response,
      elapsedMs: Date.now() - startedAt,
      message: error?.message,
    });
    throw error;
  }
};
