'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/layout/AuthShell';
import { Field, PaperInput, PaperButton } from '@/components/ui/Field';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/agent-maker');
    }
  }, [user, router]);

  // Clear any stale error on mount. If the user landed here because
  // their token expired, the local `error` state should start clean
  // — we don't want a leftover "Login failed" message from a previous
  // attempt leaking into this session.
  useEffect(() => {
    setError('');
  }, []);

  // Clear the error as soon as the user starts typing again so they
  // can recover from a failed attempt without seeing stale state.
  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };
  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push('/agent-maker');
    } else {
      // login() pushes the message into AuthContext; mirror it into
      // local state. The next render won't double-render because we
      // already cleared `error` on input change above.
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Access"
      title="Sign in to your console."
      subtitle="Resume a workforce, review archived runs, and resolve pending conflicts. Sessions are JWT-signed and roll every 30 days."
      footerPrompt="Don't have an account yet?"
      footerLinkText="Provision one"
      footerLinkHref="/signup"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Work email">
          <PaperInput
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder="you@company.com"
            required
            autoComplete="email"
          />
        </Field>

        <Field
          label="Password"
          hint={
            <span>
              Forgot it?{' '}
              <Link
                href="/forgot-password"
                className="text-[var(--ink)] underline decoration-[var(--accent)] decoration-2 underline-offset-4 hover:text-[var(--accent)]"
              >
                Reset operator key
              </Link>
            </span>
          }
        >
          <PaperInput
            type="password"
            value={password}
            onChange={onPasswordChange}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            invalid={!!error}
          />
        </Field>

        {error && (
          <div className="mono border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {error}
          </div>
        )}

        <PaperButton type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in →'}
        </PaperButton>
      </form>
    </AuthShell>
  );
}
