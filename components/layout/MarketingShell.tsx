'use client';

import { ReactNode } from 'react';
import { Suspense } from 'react';
import Topbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Container from '@/components/ui/Container';

/**
 * MarketingShell — used by public marketing pages (ai-agents, careers,
 * resources, try-agent). It pairs the topbar with the paper background
 * and gives pages a consistent intro band.
 *
 * Use the `intro` slot for a page-level eyebrow + headline + description
 * block. Use `children` for the rest of the page.
 */
type MarketingShellProps = {
    children: ReactNode;
    /** Section marker, e.g. "06" */
    number?: string;
    /** Short eyebrow text, e.g. "Workforce" */
    eyebrow?: string;
    /** Page title */
    title?: ReactNode;
    /** Page description */
    description?: ReactNode;
    /** Optional content placed next to the intro on the right */
    aside?: ReactNode;
    /** Hide the footer (e.g. for landing pages) */
    hideFooter?: boolean;
};

const MarketingShell = ({
    children,
    number,
    eyebrow,
    title,
    description,
    aside,
    hideFooter = false,
}: MarketingShellProps) => {
    const hasIntro = !!(number || eyebrow || title || description || aside);

    return (
        <main className="paper min-h-screen text-[var(--ink)]">
            <Suspense fallback={null}>
                <Topbar />
            </Suspense>

            {/* Topbar is fixed; push content below it */}
            <div className="pt-16">
                {hasIntro && (
                    <section className="border-b border-[var(--ink)]">
                        <Container>
                            <div className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1.5fr_1fr] lg:py-16">
                                <div>
                                    {(number || eyebrow) && (
                                        <div className="mono mb-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                            {number && (
                                                <span className="text-[var(--accent)]">
                                                    {number}
                                                </span>
                                            )}
                                            {eyebrow && <span>{eyebrow}</span>}
                                            <span className="h-px flex-1 bg-[var(--rule-soft)]" />
                                        </div>
                                    )}
                                    {title && (
                                        <h1 className="display-tight text-[44px] leading-[1.02] text-[var(--ink)] sm:text-[60px]">
                                            {title}
                                        </h1>
                                    )}
                                    {description && (
                                        <p className="mt-5 max-w-2xl text-[16px] leading-[1.6] text-[var(--ink-2)]">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {aside && (
                                    <div className="flex items-start lg:justify-end">
                                        <div className="w-full max-w-sm border border-[var(--ink)] bg-[var(--paper-2)] p-5">
                                            {aside}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Container>
                    </section>
                )}

                {children}
            </div>

            {!hideFooter && <Footer />}
        </main>
    );
};

export default MarketingShell;
