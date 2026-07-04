import { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
};

const Button = ({
    variant = 'primary',
    className = '',
    ...props
}: ButtonProps) => {
    const base =
        'inline-flex items-center justify-center px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
        primary:
            'bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--accent)]',
        secondary:
            'border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]',
        ghost:
            'text-[var(--ink)] hover:text-[var(--accent)]',
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${className}`}
            {...props}
        />
    );
};

export default Button;
