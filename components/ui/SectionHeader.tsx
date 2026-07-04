import { ReactNode } from 'react';

type SectionHeaderProps = {
    number?: string;
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    align?: 'left' | 'center';
    children?: ReactNode;
};

const SectionHeader = ({
    number,
    eyebrow,
    title,
    description,
    align = 'left',
    children,
}: SectionHeaderProps) => {
    const alignment =
        align === 'center'
            ? 'items-center text-center'
            : 'items-start text-left';

    return (
        <div className={`flex flex-col gap-5 ${alignment}`}>
            <div className="flex items-center gap-4">
                {number && (
                    <span className="mono text-[12px] tracking-[0.2em] text-[var(--accent)]">
                        {number}
                    </span>
                )}
                {eyebrow && (
                    <span className="mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--graphite)]">
                        {eyebrow}
                    </span>
                )}
                <span className="hidden h-px flex-1 bg-[var(--ink)] sm:block" />
            </div>
            <h2 className="display text-[44px] leading-[1.02] text-[var(--ink)] sm:text-[56px]">
                {title}
            </h2>
            {description && (
                <p className="max-w-2xl text-[16px] leading-relaxed text-[var(--ink-2)]">
                    {description}
                </p>
            )}
            {children}
        </div>
    );
};

export default SectionHeader;
