"use client";

/**
 * ChatHeader — top bar of the chat screen.
 *
 * Shows:
 *   - Conversation title (click to edit, Enter to save, Esc to cancel)
 *   - Workflow picker (clickable badge → dropdown of available
 *     workflows; pick one to rebind the conversation)
 *   - Live status pill (derived from `useChatStream.status`)
 *   - A more menu with "Copy conversation" and "Delete"
 *
 * The workflow lives on the conversation, not on the message. Picking
 * a new workflow affects the *next* user turn only; existing messages
 * keep the workflow context they were generated with. The parent
 * (`ChatShell`) wires `onSetWorkflow` to PATCH /api/chats/{id}.
 *
 * The header sticks to the top of the scroll area; the parent flex
 * column has `overflow-hidden` so the body scrolls below it.
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheck,
  FiChevronDown,
  FiCpu,
  FiEdit2,
  FiMoreVertical,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import type { Conversation, StreamStatus, WorkflowOption } from "@/types/chat";

interface ChatHeaderProps {
  conversation: Conversation;
  workflowName: string | null;
  workflows: WorkflowOption[];
  streamStatus: StreamStatus;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onSetWorkflow: (workflowId: string | null) => Promise<void> | void;
}

const STATUS_LABEL: Record<StreamStatus, { text: string; tone: "ok" | "warn" | "err" | "idle" }> = {
  idle: { text: "Ready", tone: "idle" },
  sending: { text: "Sending…", tone: "warn" },
  streaming: { text: "Streaming", tone: "ok" },
  // `done` is the moment the stream ends; for a chat turn that's
  // indistinguishable from "ready" (the next user turn is a fresh
  // run). Showing "Live" was misleading.
  done: { text: "Ready", tone: "idle" },
  error: { text: "Error", tone: "err" },
  stopped: { text: "Stopped", tone: "warn" },
};

const TONE_CLASS = {
  ok: "text-[var(--ok)] border-[var(--ok)]/40 bg-[var(--ok)]/10",
  warn: "text-[var(--warn)] border-[var(--warn)]/40 bg-[var(--warn)]/10",
  err: "text-[var(--accent)] border-[var(--accent)]/40 bg-[var(--accent)]/10",
  idle: "text-[var(--graphite)] border-[var(--rule-soft)] bg-[var(--paper-2)]",
};

export default function ChatHeader({
  conversation,
  workflowName,
  workflows,
  streamStatus,
  onRename,
  onDelete,
  onSetWorkflow,
}: ChatHeaderProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  // While editing, this holds the user's in-progress title. When not
  // editing, the displayed value is the prop directly. The `key` on
  // the input remounts it when entering edit mode so the controlled
  // value resets from the latest prop without an effect.
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workflowMenuOpen, setWorkflowMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const workflowMenuRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (
        workflowMenuOpen &&
        workflowMenuRef.current &&
        !workflowMenuRef.current.contains(e.target as Node)
      ) {
        setWorkflowMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, workflowMenuOpen]);

  const status = STATUS_LABEL[streamStatus];

  const startEditing = () => {
    setEditingDraft(conversation.title);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditingDraft(null);
    setEditing(false);
  };

  const saveTitle = async () => {
    const next = (editingDraft ?? conversation.title).trim();
    if (!next || next === conversation.title) {
      cancelEditing();
      return;
    }
    await onRename(next);
    setEditingDraft(null);
    setEditing(false);
  };

  const copyAsMarkdown = () => {
    setMenuOpen(false);
    // Export-to-markdown is intentionally lightweight; a fuller export
    // is a future PR. Triggers a copy of the title as a placeholder.
    try {
      void navigator.clipboard.writeText(`# ${conversation.title}\n\n`);
    } catch { /* noop */ }
  };

  const pickWorkflow = async (id: string | null) => {
    setWorkflowMenuOpen(false);
    if (id === conversation.workflowId) return;
    await onSetWorkflow(id);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--ink)] bg-[var(--paper)] px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {editing ? (
          <input
            key={`${conversation._id}-${conversation.title}`}
            autoFocus
            value={editingDraft ?? conversation.title}
            onChange={(e) => setEditingDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void saveTitle();
              if (e.key === "Escape") cancelEditing();
            }}
            onBlur={() => void saveTitle()}
            maxLength={200}
            className="display min-w-0 max-w-[28ch] border-b border-[var(--ink)] bg-transparent text-[18px] font-medium text-[var(--ink)] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="display group flex min-w-0 items-center gap-2 text-left text-[18px] font-medium text-[var(--ink)]"
            title="Click to rename"
          >
            <span className="truncate">{conversation.title || "New chat"}</span>
            <FiEdit2 className="h-3.5 w-3.5 shrink-0 text-[var(--graphite)] opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        <span
          className={`mono inline-flex shrink-0 items-center gap-1.5 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] ${TONE_CLASS[status.tone]}`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              status.tone === "ok" ? "animate-pulse-dot bg-current" : "bg-current"
            }`}
            aria-hidden
          />
          {status.text}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Workflow picker */}
        <div className="relative" ref={workflowMenuRef}>
          <button
            type="button"
            aria-label="Change workflow"
            onClick={() => setWorkflowMenuOpen((v) => !v)}
            className="mono flex items-center gap-1.5 border border-[var(--rule-soft)] bg-[var(--paper-2)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
            title={
              conversation.workflowId
                ? "Switch the workflow for the next message"
                : "Bind this conversation to a workflow"
            }
          >
            <FiCpu className="h-3 w-3" />
            {workflowName || "Default agents"}
            <FiChevronDown className="h-3 w-3 opacity-60" />
          </button>
          {workflowMenuOpen && (
            <div className="absolute right-0 top-9 z-20 flex max-h-80 w-64 flex-col border border-[var(--ink)] bg-[var(--paper)] shadow-[2px_2px_0_0_var(--ink)]">
              <div className="border-b border-[var(--rule-soft)] px-3 py-2">
                <span className="mono text-[9px] uppercase tracking-[0.22em] text-[var(--graphite)]">
                  Workflow for next message
                </span>
              </div>
              <div className="flex max-h-64 flex-col overflow-y-auto">
                <button
                  type="button"
                  onClick={() => void pickWorkflow(null)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] hover:bg-[var(--paper-2)] ${
                    conversation.workflowId == null
                      ? "bg-[var(--paper-2)] text-[var(--ink)]"
                      : "text-[var(--ink-2)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FiX className="h-3 w-3" />
                    Default (no workflow)
                  </span>
                  {conversation.workflowId == null && (
                    <FiCheck className="h-3 w-3 text-[var(--ok)]" />
                  )}
                </button>
                {workflows.map((w) => {
                  const active = w.id === conversation.workflowId;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => void pickWorkflow(w.id)}
                      className={`flex items-center justify-between gap-2 border-t border-[var(--rule-soft)] px-3 py-2 text-left text-[12px] hover:bg-[var(--paper-2)] ${
                        active ? "bg-[var(--paper-2)] text-[var(--ink)]" : "text-[var(--ink-2)]"
                      }`}
                    >
                      <span className="truncate">{w.name}</span>
                      {active && <FiCheck className="h-3 w-3 shrink-0 text-[var(--ok)]" />}
                    </button>
                  );
                })}
                {workflows.length === 0 && (
                  <div className="border-t border-[var(--rule-soft)] px-3 py-2 text-[11px] text-[var(--graphite)]">
                    No workflows available.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Conversation options"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center border border-[var(--rule-soft)] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            <FiMoreVertical className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 flex w-44 flex-col border border-[var(--ink)] bg-[var(--paper)] shadow-[2px_2px_0_0_var(--ink)]">
              <button
                type="button"
                onClick={() => {
                  startEditing();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--ink)] hover:bg-[var(--paper-2)]"
              >
                <FiEdit2 className="h-3.5 w-3.5" /> Rename
              </button>
              <button
                type="button"
                onClick={copyAsMarkdown}
                className="flex items-center gap-2 border-t border-[var(--rule-soft)] px-3 py-2 text-left text-[12px] text-[var(--ink)] hover:bg-[var(--paper-2)]"
              >
                <FiCheck className="h-3.5 w-3.5" /> Copy title
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Delete this chat? You can recover it from Recently deleted.")) {
                    void Promise.resolve(onDelete()).then(() => router.push("/chats"));
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
      </div>
    </header>
  );
}
