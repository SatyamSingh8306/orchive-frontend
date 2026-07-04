'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/layout/AuthShell';
import { Field, PaperInput, PaperButton } from '@/components/ui/Field';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    const success = await forgotPassword(email);

    if (success) {
      setMessage('Password reset link sent to your email');
      setEmail('');
    }

    setIsLoading(false);
  };

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Reset your operator key."
      subtitle="We'll send a one-time reset link to the work email on your account. The link expires in 30 minutes."
      footerPrompt="Remembered it?"
      footerLinkText="Sign in"
      footerLinkHref="/signin"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Work email">
          <PaperInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="email"
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
          {isLoading ? 'Sending…' : 'Send reset link →'}
        </PaperButton>
      </form>
    </AuthShell>
  );
}
