import Link from 'next/link';
import MarketingShell from '@/components/layout/MarketingShell';
import PaperPanel from '@/components/ui/PaperPanel';

const DOCS = [
    { title: 'Quick Start', desc: 'From zero to a running workforce in five minutes.' },
    { title: 'Agent Architecture', desc: 'How the router, agents, and conflict tool compose.' },
    { title: 'Tool Integrations', desc: 'Connecting HTTP, ERP, CRM, and your private APIs.' },
    { title: 'Deployment Guide', desc: 'Managed, self-hosted, and air-gapped runtimes.' },
];

export default function ResourcesPage() {
    return (
        <MarketingShell
            number="07"
            eyebrow="Field Notes"
            title={
                <>
                    The reference
                    <br />
                    <span className="italic">library</span> for operators.
                </>
            }
            description="Docs, blog posts, and community channels. Everything we wish we had on day one."
            aside={
                <div>
                    <div className="mono mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
                        Channels
                    </div>
                    <ul className="space-y-2 text-[14px] text-[var(--ink)]">
                        <li className="flex items-center justify-between">
                            <span>Docs</span>
                            <span className="mono text-[10px] text-[var(--graphite)]">v1.0</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Changelog</span>
                            <span className="mono text-[10px] text-[var(--graphite)]">2026.06</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Discord</span>
                            <span className="mono text-[10px] text-[var(--graphite)]">5,200+</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>GitHub</span>
                            <span className="mono text-[10px] text-[var(--graphite)]">★ public</span>
                        </li>
                    </ul>
                </div>
            }
        >
            <section className="border-b border-[var(--ink)]">
                <div className="mx-auto w-full max-w-[1320px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
                        {/* DOCS */}
                        <div>
                            <div className="mb-6 flex items-center gap-3">
                                <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                    Documentation
                                </span>
                                <span className="h-px flex-1 bg-[var(--ink)]" />
                            </div>

                            <div className="border border-[var(--ink)] bg-[var(--paper)]">
                                {DOCS.map((d, i) => (
                                    <Link
                                        key={d.title}
                                        href="#"
                                        className={`group flex items-center justify-between gap-6 px-5 py-4 transition-colors hover:bg-[var(--paper-2)] ${
                                            i !== DOCS.length - 1
                                                ? 'border-b border-[var(--rule-soft)]'
                                                : ''
                                        }`}
                                    >
                                        <div>
                                            <div className="display text-[16px] text-[var(--ink)] group-hover:text-[var(--accent)]">
                                                {d.title}
                                            </div>
                                            <div className="mono mt-0.5 text-[10.5px] text-[var(--graphite)]">
                                                {d.desc}
                                            </div>
                                        </div>
                                        <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)] group-hover:text-[var(--accent)]">
                                            Read →
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* BLOG + COMMUNITY */}
                        <div className="space-y-10">
                            <div>
                                <div className="mb-6 flex items-center gap-3">
                                    <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                        Latest dispatch
                                    </span>
                                    <span className="h-px flex-1 bg-[var(--ink)]" />
                                </div>
                                <PaperPanel className="p-6">
                                    <span className="mono inline-block border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                                        New release
                                    </span>
                                    <h3 className="display mt-3 text-[22px] leading-tight text-[var(--ink)]">
                                        Introducing typed conflict resolution
                                    </h3>
                                    <p className="mt-2 text-[13.5px] text-[var(--ink-2)]">
                                        How the human-in-the-loop tool was rebuilt
                                        as a first-class part of the runtime,
                                        not a bolt-on.
                                    </p>
                                    <Link
                                        href="#"
                                        className="mono mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:text-[var(--accent)]"
                                    >
                                        Read dispatch →
                                    </Link>
                                </PaperPanel>
                            </div>

                            <div>
                                <div className="mb-6 flex items-center gap-3">
                                    <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                        Community
                                    </span>
                                    <span className="h-px flex-1 bg-[var(--ink)]" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { t: 'Discord', s: '5,200+ operators' },
                                        { t: 'GitHub', s: 'star & contribute' },
                                    ].map((c) => (
                                        <a
                                            key={c.t}
                                            href="#"
                                            className="border border-[var(--ink)] bg-[var(--paper)] p-4 transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                                        >
                                            <div className="display text-[16px] text-[var(--ink)] group-hover:text-[var(--paper)]">
                                                {c.t}
                                            </div>
                                            <div className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                                                {c.s}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingShell>
    );
}
