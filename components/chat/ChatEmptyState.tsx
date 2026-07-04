"use client";

/**
 * ChatEmptyState — landing screen shown on /chats and /chats/new.
 *
 * Layout:
 *   - Centered hero with a 4-card grid of suggested prompts. Each
 *     card fills the composer's textarea (does NOT create a chat).
 *   - At the bottom, the same ChatComposer used in the chat screen,
 *     in `mode="new"`. On Send the server creates the conversation
 *     and the parent navigates to /chats/{id}.
 *
 * The workflow picker is **not** here — workflows live in the chat
 * header. New conversations inherit `defaultWorkflowId` (the user's
 * last-used or first-available workflow); the user can rebind from
 * the chat screen header. See `ChatHeader` for the rebind UI.
 *
 * The component is purely presentational — the parent decides what
 * `onSelectPrompt` does and supplies the composer callbacks.
 */

import { FiHelpCircle, FiMessageSquare } from "react-icons/fi";

import ChatComposer from "./ChatComposer";
import type { ChatMessage } from "@/types/chat";
import type { StreamEvent } from "@/lib/chatEvents";

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  /** Composer callbacks. */
  onUserMessage: (msg: ChatMessage) => void;
  onAssistantContent: (content: string) => void;
  onStreamDone?: (ev: Extract<StreamEvent, { type: "done" }>) => void;
  onStreamError?: (ev: Extract<StreamEvent, { type: "error" }>) => void;
  /** Called when a brand-new conversation is created. The parent
   *  navigates to /chats/{id} so the URL reflects the chat. */
  onCreated: (conversationId: string) => void;
  /** Workflow to bind to the new conversation by default. The user
   *  can rebind from the chat header. Pass `null` to create with no
   *  workflow (the assistant will respond with a guidance note). */
  defaultWorkflowId: string | null;
  /** Controlled value of the composer's textarea. The empty state
   *  uses this so suggested prompts can fill the composer without
   *  creating a new conversation. */
  composerValue: string;
  onComposerValueChange: (next: string) => void;
  /** True while the stream is in flight — shows a thinking row above
   *  the composer so the user has feedback during the first turn. */
  isStreaming: boolean;
  /** The current streaming text (if any). Renders as a small preview. */
  streamingContent: string;
  /** Notifies the parent of stream status changes (forwarded from
   *  the composer's `onStreamStatusChange` callback). */
  onStreamStatusChange?: (status: { isStreaming: boolean; content: string }) => void;
}

const SUGGESTED_PROMPTS = [
  "Summarize today's workflow runs and flag any errors.",
  "Walk me through the active multi-agent workflow step by step.",
  "Draft an SOP for onboarding a new client into the Orkaive system.",
  "Find the last 5 conflicts raised and propose resolutions.",
];

export default function ChatEmptyState({
  onSelectPrompt,
  onUserMessage,
  onAssistantContent,
  onStreamDone,
  onStreamError,
  onCreated,
  defaultWorkflowId,
  composerValue,
  onComposerValueChange,
  isStreaming,
  streamingContent,
  onStreamStatusChange,
}: ChatEmptyStateProps) {
  return (
    <div className="flex h-full flex-col bg-[var(--paper)]">
      <div className="flex-1 overflow-y-auto px-4 py-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)]">
            <FiMessageSquare className="h-9 w-9 text-[var(--ink)]" />
          </div>
          <h2 className="display mb-3 text-center text-[28px] font-semibold text-[var(--ink)]">
            {isStreaming ? "Generating your first reply…" : "Start a new chat"}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-[14px] leading-relaxed text-[var(--ink-2)]">
            Ask the Orkaive agents anything about your workflows, conflicts,
            or operations. They&apos;ll route to the right specialist and stream
            the answer back to you.
          </p>

          {isStreaming ? (
            <div className="mb-6 w-full border border-[var(--rule-soft)] bg-[var(--paper-2)] p-5">
              <div className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[var(--ok)]" />
                Streaming
              </div>
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[var(--ink)]">
                {streamingContent || (
                  <span className="text-[var(--graphite)]">…</span>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSelectPrompt(prompt)}
                  className="group flex items-start gap-3 border border-[var(--rule-soft)] bg-[var(--paper)] p-4 text-left transition-colors hover:border-[var(--ink)] hover:bg-[var(--paper-2)]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]">
                    <FiHelpCircle className="h-4 w-4" />
                  </span>
                  <span className="text-[13px] font-medium leading-snug text-[var(--ink)] group-hover:text-[var(--accent)]">
                    {prompt}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mono mt-6 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
            ⌘N for new chat · ⌘K to search · Bind a workflow from the header
          </div>
        </div>
      </div>

      <ChatComposer
        mode="new"
        workflowId={defaultWorkflowId}
        onCreated={onCreated}
        onUserMessage={onUserMessage}
        onAssistantContent={onAssistantContent}
        onStreamDone={onStreamDone}
        onStreamError={onStreamError}
        placeholder="Ask the agents anything…"
        controlledValue={composerValue}
        onValueChange={onComposerValueChange}
        onStreamStatusChange={(s) => onStreamStatusChange?.(s)}
      />
    </div>
  );
}