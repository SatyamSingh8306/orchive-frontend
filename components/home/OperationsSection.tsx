import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const Sparkline = ({
    points,
    color = "#ff4d1f",
}: {
    points: number[];
    color?: string;
}) => {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const w = 220;
    const h = 56;
    const step = w / (points.length - 1);
    const path = points
        .map((p, i) => {
            const x = i * step;
            const y = h - ((p - min) / range) * h;
            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ");
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full">
            {/* gridlines */}
            {[0, 1, 2, 3].map((i) => (
                <line
                    key={i}
                    x1="0"
                    x2={w}
                    y1={(h / 3) * i}
                    y2={(h / 3) * i}
                    stroke="rgba(11,11,15,0.08)"
                    strokeWidth="0.5"
                />
            ))}
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <path
                d={`${path} L ${w} ${h} L 0 ${h} Z`}
                fill={color}
                opacity="0.08"
            />
            {/* end point */}
            <circle
                cx={(points.length - 1) * step}
                cy={h - ((points[points.length - 1] - min) / range) * h}
                r="3"
                fill={color}
            />
        </svg>
    );
};

const RECENT_RUNS = [
    {
        id: "run_2381",
        workflow: "Vendor escalation",
        nodes: 6,
        duration: "1.42s",
        status: "OK",
        escalated: false,
    },
    {
        id: "run_2380",
        workflow: "Q2 demand forecast",
        nodes: 9,
        duration: "3.81s",
        status: "ESCALATED",
        escalated: true,
    },
    {
        id: "run_2379",
        workflow: "GDPR sweep · EU",
        nodes: 12,
        duration: "6.04s",
        status: "OK",
        escalated: false,
    },
    {
        id: "run_2378",
        workflow: "Lead routing v2",
        nodes: 7,
        duration: "0.93s",
        status: "OK",
        escalated: false,
    },
    {
        id: "run_2377",
        workflow: "Invoice reconciliation",
        nodes: 8,
        duration: "2.11s",
        status: "BLOCKED",
        escalated: true,
    },
];

const KPI = [
    { label: "Runs today", value: "1,284", delta: "+12.4%", series: [10, 14, 12, 18, 16, 22, 26] },
    { label: "Median latency", value: "142ms", delta: "-8ms", series: [180, 175, 168, 160, 155, 150, 142] },
    { label: "Human escalations", value: "37", delta: "+5", series: [3, 5, 4, 6, 4, 7, 5] },
    { label: "Archived decisions", value: "9,212", delta: "+412", series: [120, 220, 340, 480, 660, 820, 980] },
];

const OperationsSection = () => {
    return (
        <section
            id="operations"
            className="relative border-t border-[var(--ink)] bg-[var(--paper)] py-24 sm:py-32"
        >
            <Container>
                <SectionHeader
                    number="03"
                    eyebrow="Operations"
                    title={
                        <>
                            Built to be
                            <br />
                            <span className="italic">watched</span>, not
                            demoed.
                        </>
                    }
                    description="An AI workforce is only as good as your ability to see what it's doing. Orkaive gives operators a real console — KPIs, run history, and an event log that doesn't lie."
                />

                {/* KPI grid + sparklines */}
                <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-[var(--ink)] bg-[var(--ink)] sm:grid-cols-2 lg:grid-cols-4">
                    {KPI.map((k, idx) => (
                        <div
                            key={k.label}
                            className="reveal flex flex-col gap-4 bg-[var(--paper)] p-6"
                            style={{ animationDelay: `${0.06 * idx}s` }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                    {k.label}
                                </div>
                                <div
                                    className={`mono text-[10px] uppercase tracking-[0.18em] ${
                                        k.delta.startsWith("-")
                                            ? "text-[var(--ok)]"
                                            : "text-[var(--ink)]"
                                    }`}
                                >
                                    {k.delta}
                                </div>
                            </div>
                            <div className="display text-[40px] leading-none text-[var(--ink)]">
                                {k.value}
                            </div>
                            <Sparkline points={k.series} />
                        </div>
                    ))}
                </div>

                {/* Recent runs table */}
                <div className="mt-12 border border-[var(--ink)] bg-[var(--paper-2)]">
                    <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-[var(--paper)]">
                        <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em]">
                            recent runs — last 60 minutes
                        </div>
                        <div className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-70">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                            streaming
                        </div>
                    </div>
                    <div className="mono grid grid-cols-12 border-b border-[var(--ink)] px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                        <div className="col-span-2">Run ID</div>
                        <div className="col-span-5">Workflow</div>
                        <div className="col-span-1 text-right">Nodes</div>
                        <div className="col-span-2 text-right">Duration</div>
                        <div className="col-span-2 text-right">Status</div>
                    </div>
                    {RECENT_RUNS.map((r) => (
                        <div
                            key={r.id}
                            className="grid grid-cols-12 items-center border-b border-[var(--rule-soft)] px-6 py-3 last:border-b-0 hover:bg-[var(--paper)]"
                        >
                            <div className="col-span-2 text-[11px] font-semibold text-[var(--accent)]">
                                {r.id}
                            </div>
                            <div className="col-span-5 display text-[16px] text-[var(--ink)]">
                                {r.workflow}
                            </div>
                            <div className="col-span-1 text-right text-[11px] text-[var(--ink-2)]">
                                {r.nodes}
                            </div>
                            <div className="col-span-2 text-right text-[11px] text-[var(--ink-2)]">
                                {r.duration}
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-2 text-right text-[10px] font-semibold uppercase tracking-[0.18em]">
                                {r.escalated && (
                                    <span className="border border-[var(--accent)] px-1.5 py-0.5 text-[9px] text-[var(--accent)]">
                                        HUMAN
                                    </span>
                                )}
                                <span
                                    className={
                                        r.status === "OK"
                                            ? "text-[var(--ok)]"
                                            : r.status === "ESCALATED"
                                            ? "text-[var(--accent)]"
                                            : "text-[var(--warn)]"
                                    }
                                >
                                    {r.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
};

export default OperationsSection;
