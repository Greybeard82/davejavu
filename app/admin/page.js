'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'totp'
  const [factorId, setFactorId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const handleCredentials = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setError('Too many failed attempts. Try again in 15 minutes.');
      } else {
        setError(`Supabase error: ${signInError.message} (status: ${signInError.status})`);
      }
      setLoading(false);
      return;
    }

    // Check if MFA is required
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
      // MFA enrolled — get the factor ID and move to TOTP step
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
        setStep('totp');
        setLoading(false);
        return;
      }
    }

    // No MFA or already at AAL2 — go straight to dashboard
    router.push('/admin/dashboard');
  };

  const handleTotp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError('Failed to initiate verification. Please try again.');
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: totpCode.replace(/\s/g, ''),
    });

    if (verifyError) {
      setError('Invalid code. Please check your authenticator app and try again.');
      setLoading(false);
      return;
    }

    router.push('/admin/dashboard');
  };

  const lockoutMinutes = lockedUntil
    ? Math.ceil((lockedUntil - Date.now()) / 60000)
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image src="/logo.png" alt="DAVEJAVU" width={120} height={60} className="object-contain" />
        </div>

        <h1 className="text-center text-xs uppercase tracking-[4px] font-600 text-charcoal mb-8">
          {step === 'credentials' ? 'Admin Access' : 'Two-Factor Verification'}
        </h1>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-mid-gray mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLocked}
                className="w-full px-4 py-3 bg-white border border-[#d1d1d1] text-charcoal text-sm focus:outline-none focus:border-orange transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-mid-gray mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLocked}
                className="w-full px-4 py-3 bg-white border border-[#d1d1d1] text-charcoal text-sm focus:outline-none focus:border-orange transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-600 tracking-wide">{error}</p>
            )}
            {isLocked && (
              <p className="text-[11px] text-red-600 tracking-wide">
                Account locked. Try again in {lockoutMinutes} minute{lockoutMinutes !== 1 ? 's' : ''}.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="mt-2 w-full py-3 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="flex flex-col gap-4">
            <p className="text-sm text-mid-gray text-center leading-relaxed">
              Enter the 6-digit code from your authenticator app.
            </p>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-mid-gray mb-2">Authentication Code</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full px-4 py-3 bg-white border border-[#d1d1d1] text-charcoal text-sm text-center tracking-[8px] focus:outline-none focus:border-orange transition-colors"
                placeholder="000000"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-600 tracking-wide">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-orange text-white text-xs uppercase tracking-[3px] font-600 hover:bg-orange-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(''); setTotpCode(''); }}
              className="text-[11px] text-mid-gray hover:text-orange transition-colors text-center"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
