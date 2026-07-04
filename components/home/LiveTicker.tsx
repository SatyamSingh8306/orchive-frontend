import Container from "@/components/ui/Container";

type Event = {
    ts: string;
    node: string;
    action: string;
    target: string;
    status: "OK" | "BLOCKED" | "ESCALATED" | "RUN" | "RESOLVED";
};

const EVENTS: Event[] = [
    {
        ts: "14:02:11.412",
        node: "router",
        action: "classified",
        target: "supply_chain_agent",
        status: "OK",
    },
    {
        ts: "14:02:11.587",
        node: "supply_chain_agent",
        action: "queried",
        target: "warehouse_eu_3",
        status: "RUN",
    },
    {
        ts: "14:02:12.103",
        node: "supply_chain_agent",
        action: "flagged",
        target: "po_44192 lead_time",
        status: "ESCALATED",
    },
    {
        ts: "14:02:14.221",
        node: "operator@acme",
        action: "approved",
        target: "alternative_vendor",
        status: "RESOLVED",
    },
    {
        ts: "14:02:18.940",
        node: "client_agent",
        action: "drafted",
        target: "reply_to_#CST-1182",
        status: "OK",
    },
    {
        ts: "14:02:21.005",
        node: "compliance_agent",
        action: "archived",
        target: "audit_trail#2026-06-10",
        status: "OK",
    },
    {
        ts: "14:02:25.770",
        node: "process_agent",
        action: "rerouted",
        target: "approval_bottleneck",
        status: "BLOCKED",
    },
    {
        ts: "14:02:30.108",
        node: "synth",
        action: "emitted",
        target: "run_2381",
        status: "OK",
    },
];

const STATUS_COLOR: Record<Event["status"], string> = {
    OK: "text-[var(--ok)]",
    RUN: "text-[var(--blueprint)]",
    BLOCKED: "text-[var(--warn)]",
    ESCALATED: "text-[var(--accent)]",
    RESOLVED: "text-[var(--ink)]",
};

const LiveTicker = () => {
    // duplicate for seamless loop
    const items = [...EVENTS, ...EVENTS];

    return (
        <section
            aria-label="Live operational feed"
            className="relative border-y border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
        >
            <Container className="relative overflow-hidden">
                <div className="flex items-center gap-4 py-3">
                    {/* fixed label */}
                    <div className="mono flex shrink-0 items-center gap-2 border-r border-[var(--paper)]/20 pr-4 text-[10px] uppercase tracking-[0.2em]">
                        <span className="relative inline-flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        </span>
                        <span>live feed</span>
                    </div>

                    {/* scrolling strip */}
                    <div className="relative flex-1 overflow-hidden">
                        <div className="flex w-max animate-ticker gap-10 whitespace-nowrap">
                            {items.map((e, i) => (
                                <div
                                    key={i}
                                    className="mono flex items-center gap-3 text-[11px]"
                                >
                                    <span className="text-[var(--paper)]/50">
                                        {e.ts}
                                    </span>
                                    <span className="text-[var(--paper)]">
                                        {e.node}
                                    </span>
                                    <span className="text-[var(--paper)]/60">
                                        {e.action}
                                    </span>
                                    <span className="text-[var(--paper)]">
                                        {e.target}
                                    </span>
                                    <span
                                        className={`${STATUS_COLOR[e.status]} font-semibold`}
                                    >
                                        [{e.status}]
                                    </span>
                                    <span className="text-[var(--paper)]/30">
                                        ·
                                    </span>
                                </div>
                            ))}
                        </div>
                        {/* edge fades */}
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[var(--ink)] to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--ink)] to-transparent" />
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default LiveTicker;
