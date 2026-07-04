import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

type Agent = {
    id: string;
    name: string;
    role: string;
    capabilities: string;
    tools: string[];
    status: "ONLINE" | "TRAINING" | "STANDBY";
    sla: string;
};

const AGENTS: Agent[] = [
    {
        id: "A.01",
        name: "Supply Chain",
        role: "Inventory & logistics",
        capabilities:
            "Forecasts demand, drafts purchase orders, watches lead times",
        tools: ["ERP bridge", "Vendor API", "Conflict tool"],
        status: "ONLINE",
        sla: "p95 220ms",
    },
    {
        id: "A.02",
        name: "Process",
        role: "Workflow & approvals",
        capabilities:
            "Routes approvals, unblocks bottlenecks, automates repeatable ops",
        tools: ["Doc parser", "Ticketing", "Conflict tool"],
        status: "ONLINE",
        sla: "p95 310ms",
    },
    {
        id: "A.03",
        name: "Client",
        role: "Customer & sales",
        capabilities:
            "Drafts replies, qualifies leads, escalates unhappy accounts",
        tools: ["CRM sync", "Mail", "Conflict tool"],
        status: "ONLINE",
        sla: "p95 410ms",
    },
    {
        id: "A.04",
        name: "Optimization",
        role: "Analytics & simulation",
        capabilities:
            "Builds what-if models, surfaces KPI deltas, recommends trades",
        tools: ["Warehouse", "BI bridge", "Conflict tool"],
        status: "TRAINING",
        sla: "p95 —",
    },
    {
        id: "A.05",
        name: "Compliance",
        role: "Audit & policy",
        capabilities:
            "Monitors regulatory drift, flags policy violations, writes reports",
        tools: ["Doc search", "Vault", "Conflict tool"],
        status: "ONLINE",
        sla: "p95 280ms",
    },
    {
        id: "A.06",
        name: "Deep Search",
        role: "Research & synthesis",
        capabilities:
            "Crawls sources, chunks, summarizes, returns citable evidence",
        tools: ["Crawler", "Vector store", "Conflict tool"],
        status: "STANDBY",
        sla: "p95 1.2s",
    },
];

const StatusDot = ({ status }: { status: Agent["status"] }) => {
    const color =
        status === "ONLINE"
            ? "bg-[var(--ok)]"
            : status === "TRAINING"
            ? "bg-[var(--blueprint)]"
            : "bg-[var(--graphite)]";
    return (
        <span className="inline-flex items-center gap-2">
            <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${color} ${
                    status === "ONLINE" ? "animate-pulse-dot" : ""
                }`}
            />
            <span className="mono text-[10px] font-semibold uppercase tracking-[0.2em]">
                {status}
            </span>
        </span>
    );
};

const WorkforceSection = () => {
    return (
        <section
            id="workforce"
            className="relative border-t border-[var(--ink)] bg-[var(--paper-2)] py-24 sm:py-32"
        >
            <Container>
                <SectionHeader
                    number="02"
                    eyebrow="Workforce Roster"
                    title={
                        <>
                            Six specialists.
                            <br />
                            One{" "}
                            <span className="italic">shared</span> runtime.
                        </>
                    }
                    description="Every agent in the Orkaive roster shares the same contract: typed inputs, declared tools, observable traces, and a hard escalation path back to a human. Compose them; the runtime handles the wiring."
                />

                <div className="mt-16 border border-[var(--ink)] bg-[var(--paper)]">
                    {/* Desktop / tablet head — 12-col grid, hidden on phones */}
                    <div className="mono hidden grid-cols-12 items-center border-b border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] md:grid">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-2">Agent</div>
                        <div className="col-span-4">Capabilities</div>
                        <div className="col-span-2">Tools</div>
                        <div className="col-span-1">SLA</div>
                        <div className="col-span-2 text-right">Status</div>
                    </div>

                    {AGENTS.map((a, idx) => (
                        <AgentRow
                            key={a.id}
                            agent={a}
                            isLast={idx === AGENTS.length - 1}
                            delayMs={0.05 * idx}
                        />
                    ))}

                    {/* table foot */}
                    <div className="mono flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ink)] px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                        <span>Showing {AGENTS.length} of 42 deployed agents</span>
                        <a
                            href="/ai-agents"
                            className="border border-[var(--ink)] px-3 py-1 text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                        >
                            View full roster →
                        </a>
                    </div>
                </div>

                {/* callout under the table */}
                <div className="reveal mt-12 grid grid-cols-1 gap-6 border border-[var(--ink)] bg-[var(--paper)] p-8 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-10">
                    <div className="display text-[56px] leading-none text-[var(--ink)]">
                        +
                    </div>
                    <div>
                        <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                            Compose your own
                        </div>
                        <h3 className="display mt-1 text-[24px] leading-tight text-[var(--ink)]">
                            Bring a specialist. The runtime absorbs it.
                        </h3>
                        <p className="mt-2 max-w-xl text-[14px] text-[var(--ink-2)]">
                            Orkaive ships with a typed contract for adding your
                            own agents. Drop in a system prompt, declare your
                            tools, and the router, archive, and human-checkpoint
                            pipeline work for it on day one.
                        </p>
                    </div>
                    <a
                        href="/agent-maker"
                        className="mono inline-flex items-center gap-3 self-start border border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)] sm:self-auto"
                    >
                        Open Agent Maker →
                    </a>
                </div>
            </Container>
        </section>
    );
};

export default WorkforceSection;

/* ------------------------------------------------------------------ */
/* Agent row — responsive                                             */
/*                                                                    */
/* On phones: stacked card with an ID strip + name + role + status    */
/*           on top, then a definition list of capabilities/tools/sla */
/* On md+:   the original 12-col table row.                           */
/* ------------------------------------------------------------------ */
function AgentRow({
    agent: a,
    isLast,
    delayMs,
}: {
    agent: Agent;
    isLast: boolean;
    delayMs: number;
}) {
    const borderCls = isLast ? '' : 'border-b border-[var(--rule-soft)]';

    return (
        <>
            {/* Mobile card (default). Hidden on md+. */}
            <div
                className={`reveal md:hidden ${borderCls} space-y-3 px-5 py-5 transition-colors hover:bg-[var(--paper-2)]`}
                style={{ animationDelay: `${delayMs}s` }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="mono shrink-0 text-[11px] font-semibold text-[var(--accent)]">
                            {a.id}
                        </span>
                        <div>
                            <div className="display text-[16px] font-semibold leading-tight text-[var(--ink)]">
                                {a.name}
                            </div>
                            <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                                {a.role}
                            </div>
                        </div>
                    </div>
                    <StatusDot status={a.status} />
                </div>

                <p className="text-[13px] leading-relaxed text-[var(--ink-2)]">
                    {a.capabilities}
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                    {a.tools.map((t) => (
                        <span
                            key={t}
                            className="mono border border-[var(--ink)] bg-[var(--paper)] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--ink)]"
                        >
                            {t}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--rule-soft)] pt-2">
                    <span className="mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                        SLA
                    </span>
                    <span className="mono text-[11px] text-[var(--ink)]">
                        {a.sla}
                    </span>
                </div>
            </div>

            {/* Desktop / tablet row */}
            <div
                className={`reveal hidden grid-cols-12 items-start px-6 py-6 transition-colors hover:bg-[var(--paper-2)] md:grid ${borderCls}`}
                style={{ animationDelay: `${delayMs}s` }}
            >
                <div className="col-span-1 mono text-[11px] font-semibold text-[var(--accent)]">
                    {a.id}
                </div>
                <div className="col-span-2 pr-4">
                    <div className="display text-[18px] leading-tight text-[var(--ink)]">
                        {a.name}
                    </div>
                    <div className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                        {a.role}
                    </div>
                </div>
                <div className="col-span-4 pr-4 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                    {a.capabilities}
                </div>
                <div className="col-span-2 flex flex-wrap gap-1.5">
                    {a.tools.map((t) => (
                        <span
                            key={t}
                            className="mono border border-[var(--ink)] bg-[var(--paper)] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--ink)]"
                        >
                            {t}
                        </span>
                    ))}
                </div>
                <div className="col-span-1 mono text-[11px] text-[var(--ink)]">
                    {a.sla}
                </div>
                <div className="col-span-2 flex justify-end">
                    <StatusDot status={a.status} />
                </div>
            </div>
        </>
    );
}
