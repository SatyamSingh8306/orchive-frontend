"use client";

/**
 * MessageBubble — one message in the chat log.
 *
 * Renders the role-specific visual: right-aligned dark bubble for the
 * user, left-aligned paper-2 bubble with an agent avatar for the
 * assistant. The streaming message gets a blinking caret at the end
 * of the markdown. Below the bubble a small footer with timestamp and
 * (for assistant) action buttons (copy, regenerate, stop-while-streaming).
 *
 * Layout: <avatar?> <bubble/> <avatar?>. The avatar lives in a
 * fixed-width column so the bubble column can flex to its content.
 */

import { useState } from "react";
import { FiBox, FiCheck, FiCopy, FiRefreshCw, FiUser } from "react-icons/fi";

import StreamingMarkdown from "./StreamingMarkdown";
import type { ChatMessage, MessageStatus } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  /** Widen the bubble column to match the wide MessageList layout. */
  wide?: boolean;
  onRegenerate?: () => void;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const STATUS_LABEL: Record<MessageStatus, string> = {
  streaming: "Streaming…",
  complete: "",
  error: "Failed",
  stopped: "Stopped",
};

export default function MessageBubble({
  message,
  isStreaming = false,
  wide = false,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isFailed = message.status === "error";
  const isStopped = message.status === "stopped";
  const showStatusLabel = isAssistant && (isFailed || isStopped);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <div
      className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mt-1 shrink-0">
          <div
            className={`flex h-8 w-8 items-center justify-center border border-[var(--ink)] ${
              isFailed ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-[var(--paper-2)] text-[var(--ink)]"
            }`}
          >
            <FiBox className="h-3.5 w-3.5" />
          </div>
        </div>
      )}
      <div className={`flex min-w-0 flex-col ${wide ? "max-w-[min(1000px,90%)]" : "max-w-[min(720px,85%)]"}`}>
        <div
          className={`relative px-4 py-3 text-[14px] leading-relaxed ${
            isUser
              ? "border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
              : isFailed
                ? "border border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--ink)]"
                : "border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <>
              {message.content.length === 0 && isStreaming ? (
                <ThinkingDots />
              ) : (
                <StreamingMarkdown
                  content={message.content}
                  streaming={isStreaming}
                />
              )}
            </>
          )}
        </div>

        <div
          className={`mt-1.5 flex items-center gap-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
            {STATUS_LABEL[message.status] && message.content.length === 0
              ? `${STATUS_LABEL[message.status]} · `
              : ""}
            {formatTime(message.createdAt)}
          </span>
          {isAssistant && message.content.length > 0 && !isStreaming && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={copy}
                aria-label="Copy message"
                className="flex h-6 w-6 items-center justify-center text-[var(--graphite)] hover:text-[var(--ink)]"
                title="Copy"
              >
                {copied ? <FiCheck className="h-3 w-3" /> : <FiCopy className="h-3 w-3" />}
              </button>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  aria-label="Regenerate response"
                  className="flex h-6 w-6 items-center justify-center text-[var(--graphite)] hover:text-[var(--ink)]"
                  title="Regenerate"
                >
                  <FiRefreshCw className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
        {showStatusLabel && (
          <p className="mt-1 text-[11px] text-[var(--accent)]">
            {isStopped
              ? "Generation was stopped. The reply is incomplete."
              : "Something went wrong. You can try regenerating."}
          </p>
        )}
      </div>
      {isUser && (
        <div className="mt-1 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)]">
            <FiUser className="h-3.5 w-3.5" />
          </div>
        </div>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ink)]" />
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ink)]"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ink)]"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="mono ml-2 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
        Thinking…
      </span>
    </div>
  );
}
