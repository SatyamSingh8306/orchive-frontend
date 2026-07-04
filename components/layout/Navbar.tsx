'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

type NavItem = { label: string; href: string; /** True when href is a section anchor on the home page. */ isAnchor: boolean };

const NAV: NavItem[] = [
    { label: 'Workforce', href: '#workforce', isAnchor: true },
    { label: 'Architecture', href: '#architecture', isAnchor: true },
    { label: 'Operations', href: '#operations', isAnchor: true },
    { label: 'Resolution', href: '#resolution', isAnchor: true },
    { label: 'Agents', href: '/ai-agents', isAnchor: false },
];

const Topbar = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    /**
     * Resolve a section-anchor click. If we're already on the home page,
     * smooth-scroll to the section (using its id). Otherwise navigate
     * to / + hash, and the home page's mount effect scrolls to it.
     */
    const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (!href.startsWith('#')) return; // external link — let Next handle it
        const id = href.slice(1);

        if (pathname === '/') {
            e.preventDefault();
            const target = document.getElementById(id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Update the URL hash without a full navigation.
                window.history.replaceState(null, '', href);
            }
        } else {
            // Let the browser navigate to "/#section". The home page
            // handles the scroll on mount.
            setOpen(false);
            router.push('/' + href);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="border-b border-[var(--ink)] bg-[var(--paper)]/85 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6 sm:px-10 lg:px-16">
                    {/* Logo block */}
                    <Link
                        href="/"
                        className="flex items-center gap-3 text-[var(--ink)]"
                        aria-label="Orkaive home"
                    >
                        <span className="flex h-8 w-8 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]">
                            <span className="display text-[16px] leading-none">Ø</span>
                        </span>
                        <span className="flex flex-col leading-none">
                            <span className="display text-[20px] font-medium tracking-[-0.01em]">
                                ORKAIVE
                            </span>
                            <span className="mono text-[9px] uppercase tracking-[0.22em] text-[var(--graphite)]">
                                AI workforce runtime
                            </span>
                        </span>
                    </Link>

                    {/* Center nav (desktop) */}
                    <nav className="hidden items-center gap-8 lg:flex">
                        {NAV.map((item) => (
                            <Link
                                key={item.label}
                                href={item.isAnchor ? `/${item.href}` : item.href}
                                onClick={(e) =>
                                    item.isAnchor
                                        ? handleAnchorClick(e, item.href)
                                        : undefined
                                }
                                className="mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right cluster */}
                    <div className="hidden items-center gap-4 lg:flex">
                        <div className="mono flex items-center gap-2 border border-[var(--ink)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)]">
                            <span className="relative inline-flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-50" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                            </span>
                            <span>system live</span>
                        </div>
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/agent-maker"
                                    className="mono border border-[var(--ink)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                                >
                                    Open Console
                                </Link>
                                <button
                                    onClick={logout}
                                    className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)] hover:text-[var(--accent)]"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/signin"
                                    className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:text-[var(--accent)]"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/try-agent"
                                    className="mono border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)]"
                                >
                                    Provision →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu trigger */}
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="mono flex items-center gap-2 border border-[var(--ink)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] lg:hidden"
                        aria-expanded={open}
                    >
                        <span className="block h-2 w-3 border-y border-[var(--ink)]" />
                        Menu
                    </button>
                </div>

                {/* Mobile drawer */}
                {open && (
                    <div className="border-t border-[var(--ink)] bg-[var(--paper)] lg:hidden">
                        <div className="mx-auto flex max-w-[1320px] flex-col gap-1 px-6 py-6 sm:px-10">
                            {NAV.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.isAnchor ? `/${item.href}` : item.href}
                                    onClick={(e) => {
                                        if (item.isAnchor) {
                                            handleAnchorClick(e, item.href);
                                        } else {
                                            setOpen(false);
                                        }
                                    }}
                                    className="display flex items-center justify-between border-b border-[var(--rule-soft)] py-3 text-[20px] text-[var(--ink)]"
                                >
                                    <span>{item.label}</span>
                                    <span className="mono text-[10px] text-[var(--graphite)]">
                                        ↗
                                    </span>
                                </Link>
                            ))}
                            <div className="mt-4 flex items-center gap-2">
                                {user ? (
                                    <Link
                                        href="/agent-maker"
                                        onClick={() => setOpen(false)}
                                        className="mono flex-1 border border-[var(--ink)] bg-[var(--ink)] px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)]"
                                    >
                                        Open Console
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/signin"
                                            onClick={() => setOpen(false)}
                                            className="mono flex-1 border border-[var(--ink)] px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)]"
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            href="/try-agent"
                                            onClick={() => setOpen(false)}
                                            className="mono flex-1 border border-[var(--ink)] bg-[var(--ink)] px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)]"
                                        >
                                            Provision
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Topbar;
