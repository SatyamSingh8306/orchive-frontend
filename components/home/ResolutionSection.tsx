import Container from "@/components/ui/Container";

const AlertMock = () => (
    <div className="border border-[var(--ink)] bg-[var(--paper-2)]">
        {/* top strip */}
        <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[var(--paper)]">
            <div className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                conflict raised
            </div>
            <div className="mono text-[9px] uppercase tracking-[0.2em] opacity-70">
                QID 1f3a_8821
            </div>
        </div>
        {/* body */}
        <div className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                        Workflow · vendor escalation
                    </div>
                    <div className="display mt-1 text-[20px] leading-tight text-[var(--ink)]">
                        Lead time exceeds contract SLA on PO #44192.
                    </div>
                </div>
                <div className="mono flex shrink-0 items-center gap-1.5 border border-[var(--accent)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    04:51 left
                </div>
            </div>

            {/* context quote */}
            <div className="border-l-2 border-[var(--ink)] bg-[var(--paper)] p-4 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
                &ldquo;Acme Steel is reporting a 14-day slip on PO #44192.
                We&apos;ve identified two alternative vendors (Bremont, 6 days;
                Nakatomi, 9 days). Bremont is 11% above contracted rate. Approve
                premium vendor, hold to original, or escalate further?&rdquo;
            </div>

            {/* agent trace */}
            <div className="border border-[var(--rule-soft)] bg-[var(--paper)] p-3">
                <div className="mono mb-2 text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    agent trace
                </div>
                <ul className="mono space-y-1 text-[10.5px] text-[var(--ink-2)]">
                    <li>14:02:11 router → supply_chain_agent</li>
                    <li>14:02:12 tool call: vendor.lookup(po=44192)</li>
                    <li>14:02:13 tool call: vendor.alternatives(po=44192)</li>
                    <li className="text-[var(--accent)]">
                        14:02:14 ► conflict raised (high-stakes)
                    </li>
                </ul>
            </div>

            {/* choices */}
            <div className="space-y-2">
                <div className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    awaiting human decision
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {["Approve Bremont", "Hold to contract", "Escalate"].map(
                        (c, i) => (
                            <button
                                key={c}
                                className={`mono border border-[var(--ink)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                                    i === 0
                                        ? "bg-[var(--ink)] text-[var(--paper)]"
                                        : "bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                                }`}
                            >
                                {c}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
        {/* bottom strip */}
        <div className="border-t border-[var(--ink)] px-4 py-2 mono flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
            <span>owner: operator@acme</span>
            <span>channel: console · slack</span>
        </div>
    </div>
);

const ResolutionSection = () => {
    return (
        <section
            id="resolution"
            className="relative border-t border-[var(--ink)] bg-[var(--ink)] py-24 text-[var(--paper)] sm:py-32"
        >
            <Container>
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.1fr_1fr]">
                    {/* LEFT: pullquote + narrative */}
                    <div>
                        <div className="mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                            Resolution
                        </div>

                        <blockquote className="display mt-6 text-[44px] leading-[1.05] text-[var(--paper)] sm:text-[60px]">
                            &ldquo;An AI workforce that
                            <br />
                            <span className="italic">cannot ask</span> a human
                            <br />
                            is a workforce you
                            <br />
                            <span className="italic">shouldn&apos;t</span> run.&rdquo;
                        </blockquote>

                        <p className="mt-10 max-w-xl text-[16px] leading-relaxed text-[var(--paper)]/70">
                            Every Orkaive agent ships with a hard escalation
                            path. When a request crosses a confidence, stakes, or
                            policy threshold, the runtime pauses, hands the
                            question to a human with the full trace attached, and
                            waits. No auto-approval. No silent fallback.
                        </p>

                        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {[
                                {
                                    t: "Typed conflict tool",
                                    d: "Every agent receives the same conflict_resolution tool — schema-checked, observable, rate-limited.",
                                },
                                {
                                    t: "Pause-and-wait",
                                    d: "The agent graph suspends at the conflict node. No speculative answers, no half-truths.",
                                },
                                {
                                    t: "Multi-channel",
                                    d: "Humans respond from the console, Slack, or email. The trace travels with the request.",
                                },
                                {
                                    t: "Bounded default",
                                    d: "If no human responds, the runtime falls back to a policy you declared — never to a guess.",
                                },
                            ].map((item) => (
                                <li
                                    key={item.t}
                                    className="border-t border-[var(--paper)]/20 pt-4"
                                >
                                    <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                                        {item.t}
                                    </div>
                                    <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--paper)]/70">
                                        {item.d}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* RIGHT: alert mock */}
                    <div className="relative">
                        <div className="sticky top-32">
                            <AlertMock />
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default ResolutionSection;
