"use client";

/**
 * WorkflowPickerDialog — modal shown when the user clicks the
 * sidebar "new chat" (+) button. The user picks a workflow (or
 * "default agents") and the conversation is created with that
 * binding already set; they're then dropped into the chat screen.
 *
 * Why a modal (not a workflow picker on the empty state)?
 * The empty state has a composer and suggested prompts — adding
 * a workflow picker there is confusing because the user is being
 * asked to commit to a workflow before they have a conversation.
 * The modal gives the user a single, dedicated step right after
 * they click "+".
 */

import { useEffect, useRef, useState } from "react";
import { FiCpu, FiX } from "react-icons/fi";

import type { WorkflowOption } from "@/types/chat";

interface WorkflowPickerDialogProps {
  open: boolean;
  workflows: WorkflowOption[];
  loading: boolean;
  /** Initial selection when the dialog is shown. After that the
   *  user's picks are remembered for the lifetime of the dialog —
   *  cancel + reopen starts fresh. */
  defaultWorkflowId: string | null;
  /** Called with the picked workflowId (or null) when the user
   *  confirms. The parent is responsible for creating the
   *  conversation and navigating. */
  onConfirm: (workflowId: string | null) => void;
  onClose: () => void;
}

export default function WorkflowPickerDialog({
  open,
  workflows,
  loading,
  defaultWorkflowId,
  onConfirm,
  onClose,
}: WorkflowPickerDialogProps) {
  const [selected, setSelected] = useState<string | null>(defaultWorkflowId);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Note: the parent MUST pass `key={open}` (or similar) so the
  // dialog remounts on each open. This resets the internal `selected`
  // state to the current `defaultWorkflowId`. Without the key the
  // user's previous pick would persist across cancel + reopen.

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/80 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pick a workflow for this chat"
        className="flex w-full max-w-md flex-col border border-[var(--ink)] bg-[var(--paper)] shadow-[4px_4px_0_0_var(--ink)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ink)] px-5 py-4">
          <div className="flex items-center gap-2">
            <FiCpu className="h-4 w-4 text-[var(--ink)]" />
            <h2 className="display text-[16px] font-medium text-[var(--ink)]">
              Start a new chat
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center border border-[var(--rule-soft)] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="mb-3 text-[12px] leading-relaxed text-[var(--ink-2)]">
            Pick the workflow this chat will use. You can change it later
            from the chat header.
          </p>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse border border-[var(--rule-soft)] bg-[var(--paper-2)]"
                />
              ))}
            </div>
          ) : (
            <div className="flex max-h-72 flex-col overflow-y-auto border border-[var(--rule-soft)]">
              {/* "No workflow" / default agents option */}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className={`flex items-center justify-between gap-2 border-b border-[var(--rule-soft)] px-3 py-2.5 text-left text-[13px] hover:bg-[var(--paper-2)] ${
                  selected == null
                    ? "bg-[var(--paper-2)] text-[var(--ink)]"
                    : "text-[var(--ink-2)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FiX className="h-3.5 w-3.5" />
                  <span className="font-medium">Default agents</span>
                  <span className="mono text-[9px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                    no workflow
                  </span>
                </span>
                {selected == null && (
                  <span className="mono text-[9px] uppercase tracking-[0.18em] text-[var(--ok)]">
                    selected
                  </span>
                )}
              </button>
              {workflows.map((w) => {
                const active = w.id === selected;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelected(w.id)}
                    className={`flex items-center justify-between gap-2 border-b border-[var(--rule-soft)] px-3 py-2.5 text-left text-[13px] last:border-b-0 hover:bg-[var(--paper-2)] ${
                      active
                        ? "bg-[var(--paper-2)] text-[var(--ink)]"
                        : "text-[var(--ink-2)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FiCpu className="h-3.5 w-3.5" />
                      <span className="truncate font-medium">{w.name}</span>
                    </span>
                    {active && (
                      <span className="mono text-[9px] uppercase tracking-[0.18em] text-[var(--ok)]">
                        selected
                      </span>
                    )}
                  </button>
                );
              })}
              {workflows.length === 0 && !loading && (
                <div className="px-3 py-4 text-center text-[12px] text-[var(--graphite)]">
                  No workflows available. The chat will use default agents.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--rule-soft)] bg-[var(--paper-2)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--ink)] bg-[var(--paper)] px-4 py-1.5 text-[12px] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(selected)}
            className="mono border border-[var(--ink)] bg-[var(--ink)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
          >
            Start chat
          </button>
        </div>
      </div>
    </div>
  );
}