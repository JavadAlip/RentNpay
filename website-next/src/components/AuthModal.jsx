'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { X, ArrowRight } from 'lucide-react';
import { api } from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';
import { USER_AUTH, normalizeUserFromApi } from '@/lib/api';
import {
  AUTH_REDIRECT_SESSION_KEY,
  useAuthModal,
} from '@/contexts/AuthModalContext';

// ── OTP Input component ───────────────────────────────────────────────────────
function OtpInputs({ value, onChange, disabled }) {
  const inputsRef = useRef([]);
  const chars = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const handleChange = (i, raw) => {
    const c = raw.replace(/\D/g, '').slice(-1);
    const next = Array.from({ length: 6 }, (_, j) => value[j] ?? '');
    next[i] = c;
    onChange(next.join('').replace(/\D/g, '').slice(0, 6));
    if (c && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !chars[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t) {
      e.preventDefault();
      onChange(t);
      const idx = Math.min(t.length, 5);
      inputsRef.current[idx]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={chars[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-full min-w-0 aspect-square max-w-[44px] text-center text-lg font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      ))}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AuthModal() {
  const { open, view, closeAuth } = useAuthModal();
  const dispatch = useDispatch();
  const router = useRouter();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  const [screen, setScreen] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpRevealed, setDevOtpRevealed] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync screen with the view requested by openAuth()
  useEffect(() => {
    if (!open) return;
    setScreen(view === 'signup' ? 'signup' : 'login');
    setError('');
    setOtp('');
    setDevOtpRevealed(false);
  }, [open, view]);

  // Auto-close when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && open) closeAuth();
  }, [isAuthenticated, open, closeAuth]);

  // Lock page scroll while auth modal is open.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const reset = () => {
    setError('');
    setLoading(false);
  };
  const emailAddress = email.trim();

  // ── Signup ──────────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agree) {
      setError('Please agree to the Terms & Conditions and Privacy Policies.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(USER_AUTH.signup, {
        fullName: fullName.trim(),
        emailAddress,
        password,
      });
      const testOtp = String(data?.testOtp ?? '').trim();
      const hasTestOtp = /^\d{6}$/.test(testOtp);
      setDevOtpRevealed(hasTestOtp);
      setOtp(hasTestOtp ? testOtp : '');
      setScreen('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP then auto-login ──────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // 1. Verify OTP
      await api.post(USER_AUTH.verifyOtp, { emailAddress, otp: otp.trim() });

      // 2. Auto-login with the same credentials
      const { data } = await api.post(USER_AUTH.login, {
        emailAddress,
        password,
      });
      const user = normalizeUserFromApi(data.user);
      dispatch(setCredentials({ user, token: data.token }));
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rn_login_welcome', '1');
      }

      closeAuth();
      const redirect = sessionStorage.getItem(AUTH_REDIRECT_SESSION_KEY) || '/';
      sessionStorage.removeItem(AUTH_REDIRECT_SESSION_KEY);
      router.push(redirect);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Verification failed. Check the code and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(USER_AUTH.login, {
        emailAddress,
        password,
      });
      const user = normalizeUserFromApi(data.user);
      dispatch(setCredentials({ user, token: data.token }));
      sessionStorage.setItem('rn_login_welcome', '1');
      closeAuth();
      const redirect = sessionStorage.getItem(AUTH_REDIRECT_SESSION_KEY) || '/';
      sessionStorage.removeItem(AUTH_REDIRECT_SESSION_KEY);
      router.push(redirect);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-3 sm:px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[min(90vh,720px)]">
        {/* Left image panel */}
        <div className="hidden md:flex md:w-1/2 bg-primary-50 items-center justify-center">
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🛋️</div>
            <h3 className="text-xl font-bold text-gray-800">
              Rent what you need
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Furniture, electronics & more. Flexible daily rental.
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full md:w-1/2 flex flex-col min-h-0 p-6 sm:p-8 relative">
          <button
            type="button"
            onClick={closeAuth}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <X size={22} />
          </button>

          {/* ── SIGNUP FORM ── */}
          {screen === 'signup' && (
            <form onSubmit={handleSignup} className="flex flex-col flex-1 pt-2">
              <h2
                id="auth-modal-title"
                className="text-xl font-semibold text-gray-900 pr-8"
              >
                Create your account
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your details to sign up
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-800">
                    Full name
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-800">
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-800">
                    Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 mt-4 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300"
                />
                <span>
                  I agree to the{' '}
                  <span className="text-primary">Terms & Conditions</span> and{' '}
                  <span className="text-primary">Privacy Policy</span>.
                </span>
              </label>

              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-primary hover:bg-primary-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create account'}
                <ArrowRight size={18} />
              </button>

              <p className="text-sm text-gray-600 mt-6 text-center">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => {
                    reset();
                    setScreen('login');
                  }}
                >
                  Login
                </button>
              </p>
            </form>
          )}

          {/* ── OTP FORM ── */}
          {screen === 'otp' && (
            <form
              onSubmit={handleVerifyOtp}
              className="flex flex-col flex-1 pt-2"
            >
              <h2
                id="auth-modal-title"
                className="text-xl font-semibold text-gray-900 pr-8"
              >
                Verify your email
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter the 6-digit code sent to{' '}
                <span className="font-medium text-gray-700">
                  {emailAddress}
                </span>
              </p>

              {devOtpRevealed ? (
                <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
                  Test OTP auto-filled for this environment.
                </div>
              ) : null}

              <div className="mt-6">
                <label className="text-sm font-medium text-gray-800 mb-2 block">
                  One-time password
                </label>
                <OtpInputs value={otp} onChange={setOtp} disabled={loading} />
              </div>

              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="mt-6 w-full bg-primary hover:bg-primary-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify & continue'}
                <ArrowRight size={18} />
              </button>

              <p className="text-sm text-gray-600 mt-6 text-center">
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => {
                    reset();
                    setOtp('');
                    setDevOtpRevealed(false);
                    setScreen('signup');
                  }}
                >
                  ← Back to sign up
                </button>
              </p>
            </form>
          )}

          {/* ── LOGIN FORM ── */}
          {screen === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col flex-1 pt-2">
              <h2
                id="auth-modal-title"
                className="text-xl font-semibold text-gray-900 pr-8"
              >
                Login to your account
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email and password
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-800">
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-800">
                    Password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-primary hover:bg-primary-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Logging in…' : 'Login'}
                <ArrowRight size={18} />
              </button>

              <p className="text-sm text-gray-600 mt-6 text-center">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => {
                    reset();
                    setScreen('signup');
                  }}
                >
                  Sign up
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
