import {
    ReactNode,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
    ButtonHTMLAttributes,
} from 'react';

type FieldProps = {
    label: string;
    hint?: ReactNode;
    error?: string;
    children: ReactNode;
};

/**
 * Field — paper-style form row. Pairs a monospace label with a hairline
 * underline beneath the input. Use with <PaperInput />, <PaperTextarea />,
 * or <PaperButton />.
 */
export const Field = ({ label, hint, error, children }: FieldProps) => {
    return (
        <label className="block">
            <span className="mono mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                {label}
            </span>
            {children}
            {hint && !error && (
                <span className="mono mt-1.5 block text-[10px] text-[var(--graphite)]">
                    {hint}
                </span>
            )}
            {error && (
                <span className="mono mt-1.5 block text-[10px] text-[var(--accent)]">
                    {error}
                </span>
            )}
        </label>
    );
};

type PaperInputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean;
  };

export const PaperInput = ({
  className = '',
  invalid,
  ...props
}: PaperInputProps) => {
  return (
    <input
      suppressHydrationWarning
      className={`h-11 w-full border-b bg-transparent px-1 text-[15px] text-[var(--ink)] placeholder:text-[var(--graphite)] mono focus:outline-none transition-colors ${
        invalid
          ? 'border-[var(--accent)] focus:border-[var(--accent)]'
          : 'border-[var(--ink)] focus:border-[var(--accent)]'
      } ${className}`}
      {...props}
    />
  );
};

type PaperTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    invalid?: boolean;
};

export const PaperTextarea = ({ className = '', invalid, ...props }: PaperTextareaProps) => {
    return (
        <textarea
            className={`min-h-[96px] w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--graphite)] focus:border-[var(--accent)] focus:outline-none transition-colors mono ${
                invalid ? 'border-[var(--accent)]' : ''
            } ${className}`}
            {...props}
        />
    );
};

type PaperButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
};

export const PaperButton = ({
    className = '',
    variant = 'primary',
    type,
    ...props
}: PaperButtonProps) => {
    const base =
        'inline-flex items-center justify-center w-full px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]';
    const variants: Record<string, string> = {
        primary:
            'bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--accent)]',
        secondary:
            'border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]',
        ghost:
            'text-[var(--ink)] hover:text-[var(--accent)]',
    };
    return (
        <button
            type={type ?? 'button'}
            className={`${base} ${variants[variant]} ${className}`}
            {...props}
        />
    );
};
