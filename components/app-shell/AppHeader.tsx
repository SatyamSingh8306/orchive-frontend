'use client';

import { useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCopy, FiDownload } from 'react-icons/fi';
import { ConflictBadge, ConflictPanel, ConflictToast } from '@/components/conflict';
import { useSocket } from '@/lib/useSocket';

type AppHeaderProps = {
    title: string;
    subtitle?: string;
    /**
     * If true, render a back arrow. Off by default — the sidebar is the
     * primary nav, so a back button next to the page title is just
     * visual noise on most pages.
     */
    showBack?: boolean;
    /**
     * Chat-style header extras. When provided, a "Copy" + "Save"
     * button cluster is rendered on the right. Only meaningful for
     * the try-agent / chat pages.
     */
    chatData?: { role: string; content: string; timestamp: string }[];
    /** When true, enable the live conflict panel (chat pages). */
    workflowId?: string;
    /** Arbitrary right-aligned actions for non-chat pages. */
    actions?: ReactNode;
};

export default function AppHeader({
    title,
    subtitle,
    showBack = false,
    chatData,
    workflowId,
    actions,
}: AppHeaderProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [showConflictPanel, setShowConflictPanel] = useState(false);

    const DEFAULT_ADMIN_EMAIL =
        process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL || 'admin@localhost';

    useSocket({
        workflowId: workflowId || 'default',
        adminEmail: user?.email || DEFAULT_ADMIN_EMAIL,
    });

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/agent-maker');
        }
    };

    const handleCopy = async () => {
        const payload = JSON.stringify(
            {
                user: user ? { id: user.id, name: user.name, email: user.email } : null,
                chatHistory: chatData || [],
                page: title,
                timestamp: new Date().toISOString(),
            },
            null,
            2
        );
        try {
            await navigator.clipboard.writeText(payload);
            alert('User data and chat history copied to clipboard!');
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = payload;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
            alert('User data and chat history copied to clipboard!');
        }
    };

    const handleSave = () => {
        const data = {
            user: user ? { id: user.id, name: user.name, email: user.email } : null,
            chatHistory: chatData || [],
            timestamp: new Date().toISOString(),
            page: title,
        };

        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orkaive-chat-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Chat data saved successfully!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save data. Please try again.');
        }
    };

    return (
        <header className="sticky top-0 z-40 border-b border-[var(--ink)] bg-[var(--paper)]/85 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6 lg:py-4">
                {/* Left: optional back + page title */}
                <div className="flex min-w-0 items-center gap-3 lg:gap-4">
                    {showBack && (
                        <button
                            onClick={handleBack}
                            className="mono inline-flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                            type="button"
                            aria-label="Back"
                        >
                            <FiArrowLeft className="h-3.5 w-3.5" />
                        </button>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="mono text-[9px] uppercase tracking-[0.22em] text-[var(--graphite)]">
                            Page
                        </div>
                        <div className="display truncate text-[16px] font-medium leading-tight text-[var(--ink)] lg:text-[18px]">
                            {title}
                        </div>
                        {subtitle && (
                            <div className="mono mt-0.5 truncate text-[10px] text-[var(--graphite)]">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: conflict panel + chat buttons OR custom actions */}
                <div className="flex shrink-0 items-center gap-2 lg:gap-3">
                    {workflowId && (
                        <>
                            <ConflictBadge onClick={() => setShowConflictPanel(true)} />
                            <ConflictToast
                                adminEmail={user?.email || DEFAULT_ADMIN_EMAIL}
                                onOpenPanel={() => setShowConflictPanel(true)}
                                workflowId={workflowId}
                            />
                            <ConflictPanel
                                isOpen={showConflictPanel}
                                onClose={() => setShowConflictPanel(false)}
                                adminEmail={user?.email || DEFAULT_ADMIN_EMAIL}
                            />
                        </>
                    )}
                    {chatData && (
                        <>
                            <button
                                onClick={handleCopy}
                                className="mono inline-flex items-center gap-1.5 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                                type="button"
                                aria-label="Copy"
                            >
                                <FiCopy className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Copy</span>
                            </button>
                            <button
                                onClick={handleSave}
                                className="mono inline-flex items-center gap-1.5 border border-[var(--ink)] bg-[var(--ink)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)]"
                                type="button"
                                aria-label="Save"
                            >
                                <FiDownload className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Save</span>
                            </button>
                        </>
                    )}
                    {actions}
                </div>
            </div>
        </header>
    );
}
