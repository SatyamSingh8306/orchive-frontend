type StatCardProps = {
    label: string;
    value: string | number;
    /** Reserved for future use — keep the prop so existing call sites don't break. */
    accent?: 'purple' | 'green' | 'blue' | 'orange';
    /** Optional helper text below the value */
    hint?: string;
    /** Optional section number marker */
    number?: string;
};

/**
 * StatCard — paper surface for KPI / metric displays on the dashboard.
 * Replaces the old glassmorphism gradient cards.
 */
export default function StatCard({
    label,
    value,
    hint,
    number,
}: StatCardProps) {
    return (
        <div className="flex flex-col gap-3 border border-[var(--ink)] bg-[var(--paper)] p-5">
            <div className="flex items-center justify-between">
                <span className="mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
                    {label}
                </span>
                {number && (
                    <span className="mono text-[9px] uppercase tracking-[0.22em] text-[var(--accent)]">
                        {number}
                    </span>
                )}
            </div>
            <div className="display text-[36px] leading-none text-[var(--ink)]">
                {value}
            </div>
            {hint && (
                <div className="mono text-[9.5px] text-[var(--graphite)]">
                    {hint}
                </div>
            )}
        </div>
    );
}
