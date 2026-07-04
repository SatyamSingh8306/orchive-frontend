'use client';

import { LogRow } from '@/data/logs';

function IoBadge({ io }: { io: LogRow['io'] }) {
    const cls =
        io === 'Input'
            ? 'border-[var(--blueprint)]/40 bg-[var(--blueprint-soft)] text-[var(--blueprint)]'
            : io === 'Output'
                ? 'border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]'
                : 'border-[var(--rule-soft)] bg-[var(--paper-2)] text-[var(--graphite)]';

    return (
        <span className={`mono inline-flex items-center border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] ${cls}`}>
            {io}
        </span>
    );
}

export default function LogsTable({ rows }: { rows: LogRow[] }) {
    return (
        <div className="border border-[var(--ink)] bg-[var(--paper)]">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead className="bg-[var(--ink)]">
                        <tr className="mono text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)]">
                            <th className="px-4 py-3">Step</th>
                            <th className="px-4 py-3">Node</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">I/O</th>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr
                                key={r.id}
                                className="border-t border-[var(--rule-soft)] text-[13px] text-[var(--ink)] hover:bg-[var(--paper-2)]"
                            >
                                <td className="mono px-4 py-3 text-[var(--graphite)]">#{r.step}</td>
                                <td className="display px-4 py-3 font-semibold text-[var(--ink)]">
                                    {r.node}
                                </td>
                                <td className="mono px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                                    {r.type}
                                </td>
                                <td className="px-4 py-3">
                                    <IoBadge io={r.io} />
                                </td>
                                <td className="mono px-4 py-3 max-w-md truncate text-[12px] text-[var(--ink-2)]">
                                    {r.data}
                                </td>
                                <td className="mono px-4 py-3 text-[11px] text-[var(--graphite)]">
                                    {r.timestamp}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
