'use client';

import Link from "next/link";
import Container from "@/components/ui/Container";

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]">
            <Container>
                <div className="grid grid-cols-1 gap-12 py-20 md:grid-cols-[2fr_1fr_1fr_1fr]">
                    {/* Brand block */}
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]">
                                <span className="display text-[18px] leading-none">
                                    Ø
                                </span>
                            </span>
                            <span className="display text-[22px] font-medium">
                                ORKAIVE
                            </span>
                        </div>

                        <p className="display mt-8 max-w-md text-[26px] leading-[1.1] text-[var(--ink)]">
                            The operations layer
                            <br />
                            for enterprise AI.
                        </p>

                        <p className="mono mt-6 max-w-md text-[11px] leading-relaxed text-[var(--graphite)]">
                            Orkaive is the multi-agent runtime behind the modern
                            enterprise: a single substrate to <em>orchestrate</em>{" "}
                            specialists, <em>archive</em> every decision, and keep
                            humans meaningfully <em>in the hive</em>.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="mono mb-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                            Product
                        </h4>
                        <ul className="space-y-3 text-[14px]">
                            <li>
                                <Link
                                    href="#workforce"
                                    className="hover:text-[var(--accent)]"
                                >
                                    Workforce
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#architecture"
                                    className="hover:text-[var(--accent)]"
                                >
                                    Architecture
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#operations"
                                    className="hover:text-[var(--accent)]"
                                >
                                    Operations
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/agent-maker"
                                    className="hover:text-[var(--accent)]"
                                >
                                    Agent Maker
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="mono mb-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                            Company
                        </h4>
                        <ul className="space-y-3 text-[14px]">
                            <li>
                                <Link
                                    href="/ai-agents"
                                    className="hover:text-[var(--accent)]"
                                >
                                    AI Agents
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/resources"
                                    className="hover:text-[var(--accent)]"
                                >
                                    Resources
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/careers"
                                    className="hover:text-[var(--accent)]"
                                >
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/try-agent"
                                    className="hover:text-[var(--accent)]"
                                >
                                    Try the Console
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="mono mb-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                            Contact
                        </h4>
                        <ul className="space-y-3 text-[14px]">
                            <li>
                                <a
                                    href="mailto:satyamsingh7734@gmail.com"
                                    className="hover:text-[var(--accent)]"
                                >
                                    satyamsingh7734@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Meta strip */}
                <div className="grid grid-cols-1 gap-4 border-t border-[var(--ink)] py-6 sm:grid-cols-[1fr_auto] sm:items-center">
                    <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                        © {year} Orkaive Systems, Inc. — All rights reserved.
                    </p>
                    <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                        Made for operators, not demos.
                    </p>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
