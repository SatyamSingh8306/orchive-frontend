'use client';

import Link from 'next/link';
import MarketingShell from '@/components/layout/MarketingShell';
import PaperPanel from '@/components/ui/PaperPanel';

export default function CareersPage() {
    return (
        <MarketingShell
            number="06"
            eyebrow="Careers"
            title={
                <>
                    Help us build the
                    <br />
                    <span className="italic">substrate</span> for
                    enterprise AI.
                </>
            }
            description="We're a small, focused team building the operations layer for agentic software. If you like typed runtimes, structured outputs, and humans-in-the-loop, you'll fit in."
            aside={
                <div>
                    <div className="mono mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
                        Currently
                    </div>
                    <div className="display text-[44px] leading-none text-[var(--ink)]">
                        7
                    </div>
                    <div className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                        open roles · SF & Bengaluru
                    </div>
                </div>
            }
        >
            <section className="border-b border-[var(--ink)]">
                <div className="mx-auto w-full max-w-[1320px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
                    <div className="mb-10 flex items-center gap-3">
                        <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                            Operating principles
                        </span>
                        <span className="h-px flex-1 bg-[var(--ink)]" />
                    </div>

                    <div className="grid grid-cols-1 gap-px overflow-hidden border border-[var(--ink)] bg-[var(--ink)] md:grid-cols-3">
                        {[
                            {
                                n: "01",
                                t: "Type everything",
                                d: "We ship with explicit contracts. Inputs, outputs, side-effects, error modes — all declared, never inferred.",
                            },
                            {
                                n: "02",
                                t: "Archive first",
                                d: "Every decision is logged before it's acted on. The system of record is the source of truth; the UI is a view.",
                            },
                            {
                                n: "03",
                                t: "Humans in the loop",
                                d: "We build software that asks for help when it should. Auto-approval is a code smell.",
                            },
                        ].map((v) => (
                            <article
                                key={v.n}
                                className="flex flex-col gap-3 bg-[var(--paper)] p-8"
                            >
                                <span className="mono text-[12px] font-semibold text-[var(--accent)]">
                                    {v.n}
                                </span>
                                <h3 className="display text-[24px] leading-tight text-[var(--ink)]">
                                    {v.t}
                                </h3>
                                <p className="text-[14px] leading-relaxed text-[var(--ink-2)]">
                                    {v.d}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-b border-[var(--ink)]">
                <div className="mx-auto w-full max-w-[1320px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
                    <div className="mb-10 flex items-center gap-3">
                        <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                            Open positions
                        </span>
                        <span className="h-px flex-1 bg-[var(--ink)]" />
                    </div>

                    <PaperPanel
                        eyebrow="Currently hiring"
                        marker="07 roles"
                        className="p-8"
                    >
                        <div className="flex flex-col items-center py-12 text-center">
                            <div className="display text-[40px] text-[var(--ink)]">
                                ☉
                            </div>
                            <h3 className="mt-4 display text-[22px] text-[var(--ink)]">
                                No open positions right now
                            </h3>
                            <p className="mt-3 max-w-md text-[14px] text-[var(--ink-2)]">
                                We're between hiring sprints. If your background
                                is in distributed systems, type theory, or
                                control-room UX, send us a note — we read
                                every one.
                            </p>
                            <a
                                href="mailto:careers@orkaive.io"
                                className="mono mt-6 inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)]"
                            >
                                careers@orkaive.io →
                            </a>
                        </div>
                    </PaperPanel>
                </div>
            </section>
        </MarketingShell>
    );
}
