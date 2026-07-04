"use client";

/**
 * ConversationItem — a single row in the sidebar list.
 *
 * Shows the conversation title, last-message preview, and a relative
 * timestamp. On hover reveals rename / pin / delete actions.
 *
 * Visual state:
 *   - active (current conversation): ink left-border + paper-2 bg
 *   - pinned: small pin icon to the left of the title
 *   - hover (not active): paper-2 bg
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiEdit2,
  FiMoreHorizontal,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import type { Conversation } from "@/types/chat";

interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  onRename: (id: string, title: string) => Promise<void> | void;
  onPin: (id: string, pinned: boolean) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ConversationItem({
  conversation,
  active,
  onRename,
  onPin,
  onDelete,
}: ConversationItemProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = () => {
    if (editing) return;
    router.push(`/chats/${conversation._id}`);
  };

  const handleSaveRename = async () => {
    const next = draft.trim();
    if (!next || next === conversation.title) {
      setDraft(conversation.title);
      setEditing(false);
      return;
    }
    await onRename(conversation._id, next);
    setEditing(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      }}
      className={`group relative flex w-full cursor-pointer flex-col gap-1.5 border px-3 py-2.5 text-left transition-colors ${
        active
          ? "border-l-2 border-l-[var(--accent)] border-y-transparent border-r-transparent bg-[var(--paper-2)]"
          : "border-transparent hover:bg-[var(--paper-2)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") void handleSaveRename();
              if (e.key === "Escape") {
                setDraft(conversation.title);
                setEditing(false);
              }
            }}
            onBlur={() => void handleSaveRename()}
            className="display min-w-0 flex-1 border-b border-[var(--ink)] bg-transparent text-[14px] leading-tight text-[var(--ink)] outline-none"
            maxLength={200}
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {conversation.pinned && (
              <span
                className="mono shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]"
                aria-label="Pinned"
              >
                PIN
              </span>
            )}
            <span
              className="display truncate text-[14px] leading-tight text-[var(--ink)]"
              title={conversation.title}
            >
              {conversation.title || "New chat"}
            </span>
          </div>
        )}
        {!editing && (
          <div className="relative flex shrink-0 items-center gap-1">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
              {relativeTime(conversation.lastMessageAt)}
            </span>
            <button
              type="button"
              aria-label="More actions"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="hidden h-6 w-6 items-center justify-center text-[var(--graphite)] hover:text-[var(--ink)] group-hover:flex"
            >
              <FiMoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {!editing && (
        <p
          className="line-clamp-1 text-[12px] leading-snug text-[var(--graphite)]"
          title={conversation.lastMessagePreview}
        >
          {conversation.lastMessagePreview || "No messages yet"}
        </p>
      )}

      {menuOpen && (
        <div
          className="absolute right-2 top-9 z-10 flex flex-col border border-[var(--ink)] bg-[var(--paper)] shadow-[2px_2px_0_0_var(--ink)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--ink)] hover:bg-[var(--paper-2)]"
          >
            <FiEdit2 className="h-3.5 w-3.5" /> Rename
          </button>
          <button
            type="button"
            onClick={() => {
              void onPin(conversation._id, !conversation.pinned);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 border-t border-[var(--rule-soft)] px-3 py-2 text-left text-[12px] text-[var(--ink)] hover:bg-[var(--paper-2)]"
          >
            {conversation.pinned ? (
              <>
                <FiX className="h-3.5 w-3.5" /> Unpin
              </>
            ) : (
              <>
                <span className="mono text-[9px] font-bold">PIN</span> Pin
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete this chat? You can recover it from Recently deleted.")) {
                void onDelete(conversation._id);
              }
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 border-t border-[var(--rule-soft)] px-3 py-2 text-left text-[12px] text-[var(--accent)] hover:bg-[var(--paper-2)]"
          >
            <FiTrash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
