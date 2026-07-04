import Container from "@/components/ui/Container";
import Link from "next/link";

const Schematic = () => (
    <svg
        viewBox="0 0 540 400"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Schematic of an Orkaive agent graph"
    >
        <defs>
            <pattern
                id="schem-grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
            >
                <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="rgba(11,11,15,0.10)"
                    strokeWidth="0.5"
                />
            </pattern>
            <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
            >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0b0b0f" />
            </marker>
        </defs>

        <rect width="540" height="400" fill="url(#schem-grid)" />

        {/* outer frame */}
        <rect
            x="20"
            y="20"
            width="500"
            height="360"
            fill="none"
            stroke="#0b0b0f"
            strokeWidth="1"
        />
        <rect
            x="14"
            y="14"
            width="512"
            height="372"
            fill="none"
            stroke="#0b0b0f"
            strokeWidth="0.5"
        />

        {/* title strip */}
        <line
            x1="20"
            y1="50"
            x2="520"
            y2="50"
            stroke="#0b0b0f"
            strokeWidth="0.5"
        />
        <text
            x="30"
            y="40"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            letterSpacing="2"
            fill="#5c5750"
        >
            ROUTING TOPOLOGY
        </text>
        <text
            x="510"
            y="40"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            letterSpacing="2"
            fill="#ff4d1f"
        >
            ● LIVE
        </text>

        {/* edges (drawn-on) — vertical center = 200 */}
        <g
            stroke="#0b0b0f"
            strokeWidth="1.1"
            fill="none"
            markerEnd="url(#arrow)"
        >
            <path
                d="M 84 200 C 134 200, 154 115, 210 115"
                className="draw-stroke-fast"
            />
            <path
                d="M 84 200 C 134 200, 154 170, 210 170"
                className="draw-stroke-fast"
                style={{ animationDelay: "0.2s" }}
            />
            <path
                d="M 84 200 C 134 200, 154 225, 210 225"
                className="draw-stroke-fast"
                style={{ animationDelay: "0.35s" }}
            />
            <path
                d="M 84 200 C 134 200, 154 285, 210 285"
                className="draw-stroke-fast"
                style={{ animationDelay: "0.5s" }}
            />
            <path
                d="M 290 115 C 340 115, 360 200, 410 200"
                className="draw-stroke-fast"
                style={{ animationDelay: "0.65s" }}
            />
            <path
                d="M 290 170 C 340 170, 360 200, 410 200"
                className="draw-stroke-fast"
                style={{ animationDelay: "0.75s" }}
            />
            <path
                d="M 290 225 C 340 225, 360 200, 410 200"
                className="draw-stroke-fast"
                style={{ animationDelay: "0.85s" }}
            />
            <path
                d="M 290 285 C 340 285, 360 200, 410 200"
                className="draw-stroke-fast"
                style={{ animationDelay: "0.95s" }}
            />
        </g>

        {/* start node */}
        <g>
            <rect
                x="38"
                y="184"
                width="46"
                height="32"
                fill="var(--paper)"
                stroke="#0b0b0f"
                strokeWidth="1.3"
            />
            <text
                x="61"
                y="204"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9.5"
                fontWeight="600"
                fill="#0b0b0f"
            >
                IN
            </text>
        </g>

        {/* router */}
        <g>
            <polygon
                points="250,160 290,200 250,240 210,200"
                fill="var(--paper)"
                stroke="#0b0b0f"
                strokeWidth="1.3"
                className="draw-stroke"
            />
            <text
                x="250"
                y="204"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9.5"
                fontWeight="600"
                fill="#0b0b0f"
            >
                ROUTER
            </text>
        </g>

        {/* agents */}
        {[
            { y: 100, label: "SUPPLY", id: "A.01" },
            { y: 155, label: "PROCESS", id: "A.02" },
            { y: 210, label: "CLIENT", id: "A.03" },
            { y: 270, label: "COMPLY", id: "A.04" },
        ].map((n) => (
            <g key={n.id}>
                <rect
                    x="290"
                    y={n.y}
                    width="86"
                    height="30"
                    fill="var(--paper)"
                    stroke="#0b0b0f"
                />
                <line
                    x1="290"
                    y1={n.y}
                    x2="376"
                    y2={n.y}
                    stroke="#0b0b0f"
                    strokeWidth="0.5"
                />
                <text
                    x="333"
                    y={n.y + 19}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#0b0b0f"
                >
                    {n.label}
                </text>
                <text
                    x="295"
                    y={n.y + 10}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="7"
                    fill="#5c5750"
                >
                    {n.id}
                </text>
            </g>
        ))}

        {/* synth */}
        <g>
            <polygon
                points="460,180 500,200 460,220 420,200"
                fill="#0b0b0f"
                stroke="#0b0b0f"
                strokeWidth="1.1"
            />
            <text
                x="460"
                y="204"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9.5"
                fontWeight="600"
                fill="var(--paper)"
            >
                SYNTH
            </text>
        </g>

        {/* foot strip */}
        <line
            x1="20"
            y1="350"
            x2="520"
            y2="350"
            stroke="#0b0b0f"
            strokeWidth="0.5"
        />
        <text
            x="510"
            y="370"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8.5"
            fill="#ff4d1f"
        >
            ● live
        </text>

        {/* live pulse on router */}
        <circle
            cx="250"
            cy="200"
            r="4.5"
            fill="#ff4d1f"
            className="animate-pulse-dot"
        />
    </svg>
);

const HeroSection = () => {
    return (
        <section className="relative overflow-hidden">
            <Container className="relative">
                {/* Top status strip */}
                <div className="reveal flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink)] py-3">
                    <div className="mono flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                        <span className="flex items-center gap-2 text-[var(--ink)]">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                            System live
                        </span>
                        <span>Multi-agent runtime</span>
                        <span className="hidden sm:inline">v1.0</span>
                    </div>
                    <div className="mono flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                        <a href="#architecture" className="hover:text-[var(--ink)]">Architecture</a>
                        <span>·</span>
                        <a href="#workforce" className="hover:text-[var(--ink)]">Workforce</a>
                        <span>·</span>
                        <a href="#resolution" className="hover:text-[var(--ink)]">Resolution</a>
                    </div>
                </div>

                {/* Two-column hero — fixed internal rhythm, balanced columns */}
                <div className="grid grid-cols-1 items-stretch gap-x-12 gap-y-8 py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-x-14 lg:py-20">
                    {/* LEFT: copy */}
                    <div className="flex flex-col">
                        <div
                            className="reveal mono mb-5 inline-flex w-fit items-center gap-3 border border-[var(--ink)] bg-[var(--paper-2)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--ink)]"
                            style={{ animationDelay: "0.05s" }}
                        >
                            <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                            AI WORKFORCE INFRASTRUCTURE
                            <span className="text-[var(--graphite)]">·</span>
                            FOR ENTERPRISES
                        </div>

                        <h1
                            className="reveal display-tight text-[48px] leading-[0.98] text-[var(--ink)] sm:text-[60px] lg:text-[68px]"
                            style={{ animationDelay: "0.15s" }}
                        >
                            One substrate
                            <br />
                            for every{" "}
                            <span className="relative inline-block">
                                <span className="relative z-10">specialist</span>
                                <span
                                    aria-hidden
                                    className="absolute inset-x-0 bottom-1.5 z-0 h-2.5 bg-[var(--accent)]/80"
                                />
                            </span>
                            <br />
                            your enterprise runs.
                        </h1>

                        <p
                            className="reveal mt-6 max-w-lg text-[15px] leading-[1.6] text-[var(--ink-2)]"
                            style={{ animationDelay: "0.3s" }}
                        >
                            The operations layer for enterprise AI. Compose
                            specialist agents on a visual canvas, route every
                            request through a typed runtime, archive every
                            decision for audit, and keep a human meaningfully
                            in the loop.
                        </p>

                        {/* CTAs */}
                        <div
                            className="reveal mt-6 mb-10 flex flex-wrap items-center gap-3"
                            style={{ animationDelay: "0.45s" }}
                        >
                            <Link
                                href="/try-agent"
                                className="mono inline-flex items-center gap-3 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)]"
                            >
                                Provision a workforce
                                <span aria-hidden>→</span>
                            </Link>
                            <Link
                                href="#architecture"
                                className="mono inline-flex items-center gap-3 border border-[var(--ink)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                            >
                                Read the architecture
                            </Link>
                        </div>

                        {/* Spec strip — 3 stats, not 4 */}
                        <dl
                            className="reveal mt-auto grid grid-cols-3 gap-6 border-t border-[var(--ink)] pt-5"
                            style={{ animationDelay: "0.6s" }}
                        >
                            {[
                                {
                                    k: "Uptime",
                                    v: "99.97%",
                                    a: "trailing 90d",
                                },
                                {
                                    k: "Median latency",
                                    v: "142ms",
                                    a: "router→synth",
                                },
                                {
                                    k: "Resolved by humans",
                                    v: "9,212",
                                    a: "all-time conflicts",
                                },
                            ].map((s) => (
                                <div
                                    key={s.k}
                                    className="flex flex-col gap-1"
                                >
                                    <dt className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                        {s.k}
                                    </dt>
                                    <dd className="display text-[22px] leading-none text-[var(--ink)]">
                                        {s.v}
                                    </dd>
                                    <dd className="mono text-[9.5px] text-[var(--graphite)]">
                                        {s.a}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* RIGHT: schematic — flex-1, matches left column height exactly */}
                    <div
                        className="reveal relative"
                        style={{ animationDelay: "0.4s" }}
                    >
                        <div className="flex h-full min-h-[470px] flex-col border border-[var(--ink)] bg-[var(--paper-2)]">
                            {/* schematic toolbar */}
                            <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-[var(--paper)]">
                                <div className="mono flex items-center gap-2 text-[9.5px] uppercase tracking-[0.2em]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                                    orkaive.runtime
                                </div>
                                <div className="mono text-[9.5px] uppercase tracking-[0.2em] opacity-60">
                                    SCHEMATIC
                                </div>
                            </div>
                            <div className="flex flex-1 items-center justify-center p-4">
                                <Schematic />
                            </div>
                            {/* caption */}
                            <div className="border-t border-[var(--ink)] px-3 py-2 mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                ORCHESTRATION GRAPH · DRAG TO REWIRE
                            </div>
                            {/* scan line */}
                            <div className="scan-line" />
                        </div>

                        {/* annotation tags around the schematic */}
                        <div
                            className="reveal mono absolute -left-2 top-8 hidden -translate-x-full border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[9.5px] uppercase tracking-[0.2em] text-[var(--ink)] sm:block"
                            style={{ animationDelay: "0.7s" }}
                        >
                            A. typed router
                        </div>
                        <div
                            className="reveal mono absolute -right-2 bottom-12 hidden translate-x-full border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[9.5px] uppercase tracking-[0.2em] text-[var(--accent)] sm:block"
                            style={{ animationDelay: "0.85s" }}
                        >
                            B. human checkpoint
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default HeroSection;
