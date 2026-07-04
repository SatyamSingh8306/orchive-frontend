'use client';

import { useState, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/layout/AuthShell';
import { Field, PaperInput, PaperButton } from '@/components/ui/Field';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setIsLoading(true);
    const success = await resetPassword(token, newPassword, confirmPassword);
    if (success) {
      setMessage('Password reset successfully. Redirecting to sign in…');
      setTimeout(() => router.push('/signin'), 2000);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="New password">
        <PaperInput
          id="newPassword"
          name="newPassword"
          type="password"
          required
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          invalid={!!error}
        />
      </Field>

      <Field label="Confirm password">
        <PaperInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          invalid={!!error}
        />
      </Field>

      {error && (
        <div className="mono border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
          {error}
        </div>
      )}
      {message && (
        <div className="mono border border-[var(--ok)] bg-[var(--ok)]/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--ok)]">
          {message}
        </div>
      )}

      <PaperButton type="submit" disabled={isLoading}>
        {isLoading ? 'Resetting…' : 'Reset operator key →'}
      </PaperButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recovery"
      title="Set a new operator key."
      subtitle="Choose a strong password to complete the reset. After confirming, you'll be redirected back to the console."
      footerPrompt="Done here?"
      footerLinkText="Cancel"
      footerLinkHref="/signin"
    >
      <Suspense
        fallback={
          <div className="mono py-6 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
            Loading token…
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
