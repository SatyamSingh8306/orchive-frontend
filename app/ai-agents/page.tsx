import Link from 'next/link';
import MarketingShell from '@/components/layout/MarketingShell';

const AGENTS = [
    {
        id: 'A.01',
        name: 'Supply Chain',
        role: 'Inventory & logistics',
        body: 'Forecasts demand, drafts purchase orders, watches lead times, and re-routes around disruptions before they cost you.',
        chips: ['Forecasting', 'PO drafts', 'Lead time'],
    },
    {
        id: 'A.02',
        name: 'Process',
        role: 'Workflow & approvals',
        body: 'Routes approvals, unblocks bottlenecks, and automates the repeatable operational work that slows teams down.',
        chips: ['Approvals', 'Bottlenecks', 'BPM'],
    },
    {
        id: 'A.03',
        name: 'Client',
        role: 'Customer & sales',
        body: 'Drafts replies, qualifies leads, and escalates unhappy accounts with full history attached to the human reviewer.',
        chips: ['CRM', 'Tickets', 'Outreach'],
    },
    {
        id: 'A.04',
        name: 'Optimization',
        role: 'Analytics & simulation',
        body: 'Builds what-if models, surfaces KPI deltas, and recommends trades based on your real warehouse and BI signals.',
        chips: ['What-if', 'KPI', 'BI bridge'],
    },
    {
        id: 'A.05',
        name: 'Compliance',
        role: 'Audit & policy',
        body: 'Monitors regulatory drift, flags policy violations, and writes the audit-ready report your security team will actually sign.',
        chips: ['GDPR', 'SOX', 'Audit'],
    },
    {
        id: 'A.06',
        name: 'Deep Search',
        role: 'Research & synthesis',
        body: 'Crawls sources, chunks, summarizes, and returns citable evidence — every fact tied back to where it came from.',
        chips: ['Crawl', 'Chunk', 'Cite'],
    },
];

export default function AiAgentsPage() {
    return (
        <MarketingShell
            number="08"
            eyebrow="Workforce Roster"
            title={
                <>
                    Six specialists.
                    <br />
                    One <span className="italic">shared</span> contract.
                </>
            }
            description="Every Orkaive agent ships with typed inputs, declared tools, observable traces, and a hard escalation path back to a human. Compose them; the runtime handles the wiring."
            aside={
                <div>
                    <div className="mono mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
                        Roster size
                    </div>
                    <div className="display text-[44px] leading-none text-[var(--ink)]">
                        42
                    </div>
                    <div className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                        agents deployed · 6 pre-built
                    </div>
                </div>
            }
        >
            {/* Roster — table layout, no card grid */}
            <section className="border-b border-[var(--ink)]">
                <div className="mx-auto w-full max-w-[1320px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
                    <div className="mb-10 flex items-center gap-3">
                        <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                            The six
                        </span>
                        <span className="h-px flex-1 bg-[var(--ink)]" />
                    </div>

                    <div className="border border-[var(--ink)] bg-[var(--paper)]">
                        {/* table head */}
                        <div className="mono grid grid-cols-12 items-center border-b border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)]">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-3">Agent</div>
                            <div className="col-span-5">Brief</div>
                            <div className="col-span-3">Capabilities</div>
                        </div>

                        {AGENTS.map((a, idx) => (
                            <div
                                key={a.id}
                                className={`grid grid-cols-12 items-start px-5 py-5 hover:bg-[var(--paper-2)] ${
                                    idx !== AGENTS.length - 1
                                        ? 'border-b border-[var(--rule-soft)]'
                                        : ''
                                }`}
                            >
                                <div className="col-span-1 mono text-[11px] font-semibold text-[var(--accent)]">
                                    {a.id}
                                </div>
                                <div className="col-span-3 pr-4">
                                    <div className="display text-[18px] leading-tight text-[var(--ink)]">
                                        {a.name}
                                    </div>
                                    <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                                        {a.role}
                                    </div>
                                </div>
                                <div className="col-span-5 pr-4 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                                    {a.body}
                                </div>
                                <div className="col-span-3 flex flex-wrap gap-1.5">
                                    {a.chips.map((c) => (
                                        <span
                                            key={c}
                                            className="mono border border-[var(--ink)] bg-[var(--paper)] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--ink)]"
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-b border-[var(--ink)]">
                <div className="mx-auto w-full max-w-[1320px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
                    <div className="border border-[var(--ink)] bg-[var(--paper)] p-10 sm:p-14">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1.4fr_auto] sm:items-center">
                            <div>
                                <div className="mono mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                                    Provision
                                </div>
                                <h2 className="display text-[36px] leading-tight text-[var(--ink)] sm:text-[44px]">
                                    Compose your own.
                                </h2>
                                <p className="mt-3 max-w-xl text-[14.5px] text-[var(--ink-2)]">
                                    Bring a specialist. The runtime absorbs it on
                                    day one — router, archive, and human
                                    checkpoint pipeline included.
                                </p>
                            </div>
                            <Link
                                href="/agent-maker"
                                className="mono inline-flex items-center gap-3 self-start border border-[var(--ink)] bg-[var(--ink)] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)] sm:self-auto"
                            >
                                Open Agent Maker →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingShell>
    );
}
