import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

type Pillar = {
    letter: string;
    root: string;
    meaning: string;
    body: string;
    bullets: string[];
    glyph: React.ReactNode;
};

const PillarGlyph = ({ kind }: { kind: "orchestrate" | "archive" | "hive" }) => {
    if (kind === "orchestrate") {
        return (
            <svg viewBox="0 0 80 80" className="h-16 w-16">
                <circle
                    cx="40"
                    cy="40"
                    r="6"
                    fill="none"
                    stroke="#0b0b0f"
                    strokeWidth="1.4"
                />
                <circle
                    cx="14"
                    cy="22"
                    r="4"
                    fill="#0b0b0f"
                />
                <circle cx="66" cy="22" r="4" fill="#0b0b0f" />
                <circle cx="14" cy="58" r="4" fill="#0b0b0f" />
                <circle cx="66" cy="58" r="4" fill="#ff4d1f" />
                <line x1="40" y1="40" x2="14" y2="22" stroke="#0b0b0f" strokeWidth="1" />
                <line x1="40" y1="40" x2="66" y2="22" stroke="#0b0b0f" strokeWidth="1" />
                <line x1="40" y1="40" x2="14" y2="58" stroke="#0b0b0f" strokeWidth="1" />
                <line x1="40" y1="40" x2="66" y2="58" stroke="#ff4d1f" strokeWidth="1.4" />
            </svg>
        );
    }
    if (kind === "archive") {
        return (
            <svg viewBox="0 0 80 80" className="h-16 w-16">
                <rect
                    x="10"
                    y="14"
                    width="60"
                    height="52"
                    fill="none"
                    stroke="#0b0b0f"
                    strokeWidth="1.4"
                />
                <line x1="10" y1="26" x2="70" y2="26" stroke="#0b0b0f" strokeWidth="1" />
                <line x1="10" y1="40" x2="70" y2="40" stroke="#0b0b0f" strokeWidth="0.6" />
                <line x1="10" y1="54" x2="70" y2="54" stroke="#0b0b0f" strokeWidth="0.6" />
                <line x1="10" y1="20" x2="70" y2="20" stroke="#0b0b0f" strokeWidth="0.4" />
                <rect x="14" y="30" width="20" height="6" fill="#0b0b0f" />
                <rect x="14" y="44" width="32" height="3" fill="#5c5750" />
                <rect x="14" y="58" width="26" height="3" fill="#5c5750" />
                <circle cx="62" cy="33" r="2" fill="#ff4d1f" />
            </svg>
        );
    }
    // hive
    return (
        <svg viewBox="0 0 80 80" className="h-16 w-16">
            <polygon
                points="40,10 70,26 70,54 40,70 10,54 10,26"
                fill="none"
                stroke="#0b0b0f"
                strokeWidth="1.4"
            />
            <polygon
                points="40,24 56,32 56,48 40,56 24,48 24,32"
                fill="none"
                stroke="#0b0b0f"
                strokeWidth="1"
            />
            <polygon
                points="40,36 47,40 47,48 40,52 33,48 33,40"
                fill="#0b0b0f"
            />
            <line x1="40" y1="10" x2="40" y2="24" stroke="#0b0b0f" strokeWidth="0.5" />
            <line x1="40" y1="56" x2="40" y2="70" stroke="#0b0b0f" strokeWidth="0.5" />
        </svg>
    );
};

const PILLARS: Pillar[] = [
    {
        letter: "O",
        root: "Orchestrate",
        meaning: "the runtime",
        body: "A typed, observable runtime for composing specialist agents. Drag a node, wire an edge, deploy a workforce. Every action is schema-checked and traced.",
        bullets: [
            "Visual canvas · typed edges",
            "Deterministic router · structured outputs",
            "Per-run traces streamed to your console",
        ],
        glyph: <PillarGlyph kind="orchestrate" />,
    },
    {
        letter: "A",
        root: "Archive",
        meaning: "the system of record",
        body: "Every prompt, tool call, and decision is written to an immutable, queryable archive. Auditors get answers; engineers get a replay; legal gets a paper trail.",
        bullets: [
            "Append-only decision log",
            "Replayable runs from any node",
            "Export to S3, GCS, or your SIEM",
        ],
        glyph: <PillarGlyph kind="archive" />,
    },
    {
        letter: "H",
        root: "Hive",
        meaning: "the human layer",
        body: "When an agent hits a high-stakes decision, Orkaive pauses execution and routes the question to a human in the loop — with full context, right where they're already working.",
        bullets: [
            "Conflict raise → human review",
            "Slack · email · console channels",
            "Default behavior when the clock runs out",
        ],
        glyph: <PillarGlyph kind="hive" />,
    },
];

const ArchitectureSection = () => {
    return (
        <section
            id="architecture"
            className="relative border-t border-[var(--ink)] bg-[var(--paper)] py-24 sm:py-32"
        >
            <Container>
                <SectionHeader
                    number="01"
                    eyebrow="Architecture"
                    title={
                        <>
                            The name is the
                            <br />
                            <span className="italic">architecture.</span>
                        </>
                    }
                    description="Orkaive = Orchestrate · Archive · Hive. Three pillars, one runtime. Every workflow you build is a composition across them, and every decision is owned by exactly one of them."
                />

                <div className="mt-20 grid grid-cols-1 gap-px overflow-hidden border border-[var(--ink)] bg-[var(--ink)] md:grid-cols-3">
                    {PILLARS.map((p, idx) => (
                        <article
                            key={p.letter}
                            className="reveal group relative flex flex-col gap-6 bg-[var(--paper)] p-10 transition-colors duration-500 hover:bg-[var(--paper-2)]"
                            style={{ animationDelay: `${0.1 * idx}s` }}
                        >
                            {/* corner number */}
                            <span className="mono absolute right-6 top-6 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                {String(idx + 1).padStart(2, "0")}
                            </span>

                            {/* glyph + letter mark */}
                            <div className="flex items-start justify-between">
                                <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-3">
                                    {p.glyph}
                                </div>
                                <div className="display text-[88px] leading-none text-[var(--ink)]">
                                    {p.letter}
                                </div>
                            </div>

                            {/* title */}
                            <div>
                                <h3 className="display text-[32px] leading-[1] text-[var(--ink)]">
                                    {p.root}
                                </h3>
                                <p className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                    {p.meaning}
                                </p>
                            </div>

                            {/* body */}
                            <p className="text-[14.5px] leading-relaxed text-[var(--ink-2)]">
                                {p.body}
                            </p>

                            {/* bullet list */}
                            <ul className="mt-auto space-y-2 border-t border-[var(--rule-soft)] pt-4">
                                {p.bullets.map((b) => (
                                    <li
                                        key={b}
                                        className="mono flex items-start gap-3 text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]"
                                    >
                                        <span className="mt-[7px] inline-block h-px w-3 bg-[var(--ink)]" />
                                        <span className="normal-case tracking-normal text-[12px] text-[var(--ink-2)]">
                                            {b}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* accent hover bar */}
                            <span
                                aria-hidden
                                className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-500 group-hover:scale-x-100"
                            />
                        </article>
                    ))}
                </div>

                {/* bottom band — single line spec */}
                <div className="mono mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ink)] pt-6 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    <span>SCHEMA-CHECKED · STATEFUL · OBSERVABLE</span>
                    <span>self-host or fully managed</span>
                </div>
            </Container>
        </section>
    );
};

export default ArchitectureSection;
