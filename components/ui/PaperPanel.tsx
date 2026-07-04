import { ReactNode } from 'react';

type PaperPanelProps = {
    children: ReactNode;
    className?: string;
    /** Optional eyebrow text shown at the top-left, monospace */
    eyebrow?: string;
    /** Optional section marker like "01" or "02" */
    marker?: string;
};

/**
 * PaperPanel — the shared card surface used across the app on the
 * paper design system. Replaces the old rounded glass-card pattern.
 */
const PaperPanel = ({
    children,
    className = '',
    eyebrow,
    marker,
}: PaperPanelProps) => {
    return (
        <div
            className={`relative border border-[var(--ink)] bg-[var(--paper)] ${className}`}
        >
            {(eyebrow || marker) && (
                <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[var(--paper)]">
                    {eyebrow && (
                        <span className="mono text-[10px] font-semibold uppercase tracking-[0.2em]">
                            {eyebrow}
                        </span>
                    )}
                    {marker && (
                        <span className="mono text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">
                            {marker}
                        </span>
                    )}
                </div>
            )}
            {children}
        </div>
    );
};

export default PaperPanel;
