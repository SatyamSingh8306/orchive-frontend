'use client';

import { ReactNode, Suspense } from 'react';
import Topbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

type AuthShellProps = {
    children: ReactNode;
    /** Short eyebrow text, e.g. "Access" */
    eyebrow?: string;
    /** Headline text shown above the form. Plain string or JSX. */
    title: ReactNode;
    /** Subheadline text shown below the title */
    subtitle?: string;
    /** Footer link, e.g. "Don't have an account? Sign up" */
    footerPrompt?: string;
    footerLinkText?: string;
    footerLinkHref?: string;
    /** Hide the footer (e.g. for the try-agent page that already has its own) */
    hideFooter?: boolean;
};

/**
 * AuthShell — the shared chrome for all sign-in / sign-up / password
 * pages. The form is placed in a two-column layout with a sidecar of
 * metadata on desktop, and stacks on mobile.
 */
const AuthShell = ({
    children,
    eyebrow = "Access",
    title,
    subtitle,
    footerPrompt,
    footerLinkText,
    footerLinkHref,
    hideFooter = false,
}: AuthShellProps) => {
    return (
        <main className="paper min-h-screen text-[var(--ink)]">
            <Suspense fallback={null}>
                <Topbar />
            </Suspense>

            <div className="pt-16">
                <section className="border-b border-[var(--ink)]">
                    <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10 lg:px-16">
                        {/* two-column body */}
                        <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16">
                            {/* LEFT: copy */}
                            <div className="flex flex-col">
                                <div className="mono mb-5 inline-flex w-fit items-center gap-3 border border-[var(--ink)] bg-[var(--paper-2)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--ink)]">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                                    {eyebrow}
                                </div>
                                <h1 className="display-tight text-[44px] leading-[0.98] text-[var(--ink)] sm:text-[56px] lg:text-[68px]">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="mt-5 max-w-md text-[15px] leading-[1.6] text-[var(--ink-2)]">
                                        {subtitle}
                                    </p>
                                )}

                                <dl className="mt-auto grid grid-cols-2 gap-6 border-t border-[var(--ink)] pt-6 sm:grid-cols-3">
                                    {[
                                        { k: "Auth", v: "JWT", a: "256-bit" },
                                        { k: "Sessions", v: "30d", a: "rolling" },
                                        { k: "Uptime", v: "99.97%", a: "trailing 90d" },
                                    ].map((s) => (
                                        <div key={s.k} className="flex flex-col gap-1">
                                            <dt className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                                {s.k}
                                            </dt>
                                            <dd className="display text-[20px] leading-none text-[var(--ink)]">
                                                {s.v}
                                            </dd>
                                            <dd className="mono text-[9.5px] text-[var(--graphite)]">
                                                {s.a}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* RIGHT: form surface */}
                            <div className="relative">
                                <div className="flex flex-col border border-[var(--ink)] bg-[var(--paper-2)]">
                                    <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[var(--paper)]">
                                        <div className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                                            orkaive.console
                                        </div>
                                        <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60">
                                            {eyebrow}
                                        </div>
                                    </div>
                                    <div className="p-6 sm:p-8">{children}</div>
                                </div>
                                {footerPrompt && footerLinkText && footerLinkHref && (
                                    <p className="mt-6 text-center text-[13px] text-[var(--ink-2)]">
                                        {footerPrompt}{' '}
                                        <Link
                                            href={footerLinkHref}
                                            className="font-semibold text-[var(--ink)] underline decoration-[var(--accent)] decoration-2 underline-offset-4 hover:text-[var(--accent)]"
                                        >
                                            {footerLinkText}
                                        </Link>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {!hideFooter && <Footer />}
        </main>
    );
};

export default AuthShell;
