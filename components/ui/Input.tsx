import { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = ({ className = '', ...props }: InputProps) => {
    return (
        <input
            className={`h-12 w-full border-b border-[var(--ink)] bg-transparent px-1 text-[15px] text-[var(--ink)] placeholder:text-[var(--graphite)] mono focus:border-[var(--accent)] focus:outline-none ${className}`}
            {...props}
        />
    );
};

export default Input;
