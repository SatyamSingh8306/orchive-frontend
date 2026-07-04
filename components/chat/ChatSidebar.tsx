"use client";

/**
 * ChatSidebar — left rail of the chat surface.
 *
 * Layout (top to bottom):
 *   1. Brand / "new chat" header with collapse toggle.
 *   2. Sticky search box (debounced 200ms; empties clear the filter).
 *   3. The conversation list (grouped by date).
 *   4. Connection-status pill (Live / Reconnecting…).
 *
 * The sidebar renders inside a flex column that the parent (`ChatShell`)
 * positions on the left. On mobile it's a slide-in drawer.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiMessageSquare, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";

import ConversationList from "./ConversationList";
import ConnectionStatus from "./ConnectionStatus";
import { useChatSidebar } from "@/hooks/useChatSidebar";
import { useChatShortcuts } from "@/hooks/useChatShortcuts";

interface ChatSidebarProps {
  activeId: string | null;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewChat: () => void;
}

const COLLAPSE_KEY = "orkaive.chat.sidebar.collapsed";

export default function ChatSidebar({
  activeId,
  onCollapsedChange,
  onNewChat,
}: ChatSidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  });
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Awaited<ReturnType<ReturnType<typeof useChatSidebar>["search"]>>
  >([]);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  const sidebar = useChatSidebar();

  // Persist collapsed state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  // Debounced search.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      // The `list` memo already returns `sidebar.conversations` when the
      // query is empty, so searchResults are ignored. No need to setState.
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const results = await sidebar.search(query.trim());
      setSearchResults(results);
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, sidebar]);

  useChatShortcuts({
    onNewChat: () => onNewChat(),
    searchRef,
  });

  const list = useMemo(
    () => (query.trim() ? searchResults : sidebar.conversations),
    [query, searchResults, sidebar.conversations],
  );

  // ── Bulk clear with a 2-step confirm so an accidental click can't
  // wipe the user's history. First step: soft-delete (recoverable for
  // 7 days). The follow-up "Empty Recently deleted" appears in a toast
  // we don't render here; offering the hard purge from the same button
  // would create a footgun. The hook exposes `purgeAll` for callers
  // that want to wire it up later.
  const [clearing, setClearing] = useState(false);
  const clearAll = async () => {
    if (clearing) return;
    const count = sidebar.conversations.length;
    if (count === 0) {
      window.alert("No chats to clear.");
      return;
    }
    const ok = window.confirm(
      `Delete all ${count} chat${count === 1 ? "" : "s"}? ` +
        `They will move to "Recently deleted" and be permanently removed after 7 days.`,
    );
    if (!ok) return;
    setClearing(true);
    try {
      const removed = await sidebar.removeAll();
      // If the user is currently sitting inside a deleted conversation,
      // bail back to the empty state. The parent re-renders on this.
      if (activeId) {
        router.push("/chats");
      }
      if (removed > 0) {
        // Lightweight feedback — the sidebar already cleared.
        console.info(`Cleared ${removed} chat${removed === 1 ? "" : "s"}.`);
      }
    } finally {
      setClearing(false);
    }
  };

  if (collapsed) {
    return (
      <aside
        className="flex h-full w-12 shrink-0 flex-col items-center border-r border-[var(--ink)] bg-[var(--paper)]"
        aria-label="Chat sidebar collapsed"
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="m-2 flex h-8 w-8 items-center justify-center border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          aria-label="Open sidebar"
          title="Open sidebar (⌘B)"
        >
          <FiMessageSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNewChat()}
          className="m-2 mt-0 flex h-8 w-8 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--accent)]"
          aria-label="New chat"
          title="New chat (⌘N)"
        >
          <FiPlus className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-[var(--ink)] bg-[var(--paper)]">
      {/* Brand + new chat + collapse */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--ink)] px-4 py-4">
        <Link href="/chats" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]">
            <span className="display text-[14px] leading-none">Ø</span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="display text-[15px] font-medium tracking-[-0.01em] text-[var(--ink)]">
              ORKAIVE
            </span>
            <span className="mono text-[8px] uppercase tracking-[0.22em] text-[var(--graphite)]">
              Chats
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNewChat()}
            className="flex h-7 w-7 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--accent)]"
            aria-label="New chat (⌘N)"
            title="New chat (⌘N)"
          >
            <FiPlus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-7 w-7 items-center justify-center border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search + Clear all */}
      <div className="border-b border-[var(--rule-soft)] px-3 py-3">
        <label className="relative block">
          <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--graphite)]" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…  ⌘K"
            aria-label="Search chats"
            className="w-full border border-[var(--rule-soft)] bg-[var(--paper)] py-1.5 pl-8 pr-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--graphite)] focus:border-[var(--ink)] focus:outline-none"
          />
        </label>
        {sidebar.conversations.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={clearing}
            title="Move all chats to Recently deleted (recoverable for 7 days)"
            className="mono mt-2 flex w-full items-center justify-between border border-[var(--rule-soft)] bg-[var(--paper)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <FiTrash2 className="h-3 w-3" />
              {clearing ? "Clearing…" : "Clear all history"}
            </span>
            <span className="text-[9px] opacity-60">{sidebar.conversations.length}</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {sidebar.loading && sidebar.conversations.length === 0 ? (
          <SidebarSkeleton />
        ) : (
          <ConversationList
            conversations={list}
            activeId={activeId}
            onRename={sidebar.rename}
            onPin={sidebar.pin}
            onDelete={sidebar.remove}
            query={query}
          />
        )}
      </div>

      {/* Connection status */}
      <div className="border-t border-[var(--rule-soft)] px-4 py-2">
        <ConnectionStatus connected={sidebar.isConnected} />
      </div>
    </aside>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex h-12 animate-pulse items-center gap-2 border border-transparent px-2"
          style={{ opacity: 1 - i * 0.1 }}
        >
          <div className="h-3 w-3/4 rounded-sm bg-[var(--rule-soft)]" />
        </div>
      ))}
    </div>
  );
}
