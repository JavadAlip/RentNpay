const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || '';

const maskEmail = (email = '') => {
  const e = String(email || '').trim();
  const at = e.indexOf('@');
  if (at <= 1) return e;
  return `${e[0]}***${e.slice(at - 1)}`;
};

const ensureBrevoEnv = () => {
  const missing = [];
  if (!BREVO_API_KEY) missing.push('BREVO_API_KEY');
  if (!BREVO_FROM_EMAIL) missing.push('BREVO_FROM_EMAIL');
  if (missing.length) {
    throw new Error(
      `Brevo env missing: ${missing.join(', ')}. Set these in backend env.`,
    );
  }
};

export const sendBrevoTestOtpEmail = async (toEmail, otp) => {
  ensureBrevoEnv();
  const startedAt = Date.now();
  console.log('[BrevoTestMail] API send start', {
    to: maskEmail(toEmail),
    endpoint: BREVO_API_URL,
  });
  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          email: BREVO_FROM_EMAIL,
          name: 'RentNPay Brevo Test',
        },
        to: [{ email: toEmail }],
        subject: 'Brevo Test OTP - RentNPay',
        htmlContent: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2 style="margin:0 0 8px">Brevo OTP Verification</h2>
            <p style="margin:0 0 10px">Your OTP is:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:3px;margin:0 0 10px">${otp}</p>
            <p style="margin:0;color:#666">This OTP expires in 5 minutes.</p>
          </div>
        `,
      }),
    });
    const raw = await response.text();
    let parsed = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    if (!response.ok) {
      throw new Error(
        `Brevo API error ${response.status}: ${
          parsed?.message || raw || 'Unknown error'
        }`,
      );
    }
    console.log('[BrevoTestMail] send success', {
      to: maskEmail(toEmail),
      messageId: parsed?.messageId || null,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[BrevoTestMail] send failed', {
      to: maskEmail(toEmail),
      code: error?.code,
      elapsedMs: Date.now() - startedAt,
      message: error?.message,
    });
    throw error;
  }
};
