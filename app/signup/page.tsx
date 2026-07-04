'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/layout/AuthShell';
import { Field, PaperInput, PaperButton } from '@/components/ui/Field';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

function calculatePasswordStrength(password: string) {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 12.5;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
  return Math.min(strength, 100);
}

function strengthLabel(s: number) {
  if (s <= 25) return { text: 'Weak', fill: 'var(--accent)' };
  if (s <= 50) return { text: 'Fair', fill: 'var(--warn)' };
  if (s <= 75) return { text: 'Good', fill: 'var(--blueprint)' };
  return { text: 'Strong', fill: 'var(--ok)' };
}

export default function SignUp() {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { signup, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/agent-maker');
    }
  }, [user, router]);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    if (passwordStrength < 50) {
      setError('Password is too weak. Please choose a stronger password.');
      setIsLoading(false);
      return;
    }

    const success = await signup(formData);
    if (success) {
      router.push('/agent-maker');
    } else {
      setError(
        'Failed to create account. Username or email may already exist.'
      );
    }
    setIsLoading(false);
  };

  const strength = strengthLabel(passwordStrength);

  return (
    <AuthShell
      eyebrow="Provision"
      title="Provision a workforce."
      subtitle="Create an operator account to compose agents, archive decisions, and route conflicts. Takes about a minute."
      footerPrompt="Already running a workforce?"
      footerLinkText="Sign in"
      footerLinkHref="/signin"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Full name">
          <PaperInput
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Satyam Singh"
            required
            autoComplete="name"
          />
        </Field>

        <Field label="Work email">
          <PaperInput
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="you@company.com"
            required
            autoComplete="email"
          />
        </Field>

        <Field
          label="Password"
          hint="Min 8 characters. Mix case, digits, and a symbol for a strong score."
        >
          <PaperInput
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            invalid={!!error && passwordStrength < 50}
          />
          {/* Strength meter */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden border border-[var(--ink)] bg-[var(--paper)]">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${passwordStrength}%`,
                  background: strength.fill,
                }}
              />
            </div>
            <span
              className="mono text-[9px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: strength.fill }}
            >
              {strength.text}
            </span>
          </div>
        </Field>

        <Field label="Confirm password">
          <PaperInput
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            invalid={!!error}
          />
        </Field>

        {error && (
          <div className="mono border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {error}
          </div>
        )}

        <PaperButton type="submit" disabled={isLoading}>
          {isLoading ? 'Provisioning…' : 'Provision console →'}
        </PaperButton>
      </form>
    </AuthShell>
  );
}
