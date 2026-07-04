import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Image from "next/image";

const HowItWorksSection = () => {
    return (
        <section
            id="how-it-works"
            className="relative border-t border-[var(--ink)] bg-[var(--paper-2)] py-24 sm:py-32"
        >
            <Container>
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
                    <div className="lg:sticky lg:top-32 lg:self-start">
                        <SectionHeader
                            number="·"
                            eyebrow="Agent Maker"
                            title={
                                <>
                                    From prompt to
                                    <br />
                                    <span className="italic">production</span>{" "}
                                    in one canvas.
                                </>
                            }
                            description="Orkaive's Agent Maker is a visual workflow editor built for operators, not engineers. Draw the graph, declare the conflict points, ship the runtime."
                        />

                        <ol className="mt-10 space-y-5">
                            {[
                                {
                                    n: "01",
                                    t: "Drop your specialists",
                                    d: "Drag from a roster of 42 pre-built agents, or import your own. Each one ships with declared tools, typed I/O, and a default escalation policy.",
                                },
                                {
                                    n: "02",
                                    t: "Wire the graph",
                                    d: "Connect nodes by hand or accept the router's recommendation. Edges are typed — invalid wiring is impossible.",
                                },
                                {
                                    n: "03",
                                    t: "Declare checkpoints",
                                    d: "Mark the moments a human must review. Orkaive pauses there and waits for a decision — never for a guess.",
                                },
                                {
                                    n: "04",
                                    t: "Ship and watch",
                                    d: "Deploy to a managed region or self-host. Every run is archived; every decision is replayable.",
                                },
                            ].map((s) => (
                                <li
                                    key={s.n}
                                    className="grid grid-cols-[auto_1fr] gap-5 border-t border-[var(--ink)] pt-5"
                                >
                                    <div className="mono text-[12px] font-semibold text-[var(--accent)]">
                                        {s.n}
                                    </div>
                                    <div>
                                        <div className="display text-[18px] leading-tight text-[var(--ink)]">
                                            {s.t}
                                        </div>
                                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                                            {s.d}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Image plate */}
                    <div className="relative">
                        <div className="border border-[var(--ink)] bg-[var(--paper)]">
                            <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[var(--paper)]">
                                <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em]">
                                    orkaive.maker
                                </div>
                                <div className="mono text-[9px] uppercase tracking-[0.2em] opacity-60">
                                    LIVE PREVIEW
                                </div>
                            </div>
                            <div className="relative">
                                <Image
                                    src="/agents/worflow.png"
                                    alt="Visual workflow editor"
                                    width={1100}
                                    height={700}
                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                    className="h-auto w-full"
                                />
                            </div>
                            <div className="grid grid-cols-3 border-t border-[var(--ink)] mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                <div className="border-r border-[var(--rule-soft)] px-4 py-2">
                                    06 nodes
                                </div>
                                <div className="border-r border-[var(--rule-soft)] px-4 py-2">
                                    02 human checkpoints
                                </div>
                                <div className="px-4 py-2">
                                    schema-validated
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default HowItWorksSection;
