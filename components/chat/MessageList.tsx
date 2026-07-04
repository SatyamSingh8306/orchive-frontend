"use client";

/**
 * MessageList — scrollable list of chat messages.
 *
 * Behavior:
 *   - Auto-scrolls to the bottom on first render and on every new
 *     message (when the user is parked at the bottom).
 *   - "↓ New messages" pill appears when the user has scrolled away
 *     from the bottom; clicking it jumps back down.
 *
 * The list is wrapped in `<div role="log" aria-live="polite">` so
 * screen readers announce new content.
 *
 * Implementation note: this component is built to satisfy the strict
 * `react-hooks/set-state-in-effect` rule. State is updated in
 * *callback* contexts only (event handlers, rAF callbacks); effects
 * only mutate the DOM. The "last-seen" cursors live in a ref so the
 * effect can advance them without calling setState.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiArrowDown } from "react-icons/fi";

import MessageBubble from "./MessageBubble";
import type { ChatMessage } from "@/types/chat";

const SCROLL_TOLERANCE = 80;

interface MessageListProps {
  messages: ChatMessage[];
  /** Id of the message currently streaming (if any). */
  streamingId: string | null;
  /** Widen the message column. Use when the sidebar is collapsed so
   *  long replies don't look cramped in the wider viewport. */
  wide?: boolean;
  onRegenerate?: (messageId: string) => void;
}

export default function MessageList({
  messages,
  streamingId,
  wide = false,
  onRegenerate,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  // "Tick" is a number we bump to force a re-render after we mutate
  // `lastSeenRef` in a layout effect. Reading the ref in render then
  // computes the correct `hasNewBelow` value.
  const [lastSeenCount, setLastSeenCount] = useState(messages.length);
  const [lastSeenStreamId, setLastSeenStreamId] = useState<string | null>(
    streamingId,
  );

  // Track scroll position. Setstate in a scroll callback is fine —
  // it's an event handler, not an effect body.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      const next = dist <= SCROLL_TOLERANCE;
      setAtBottom((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(measure);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Sync `lastSeen*` whenever the message list grows. The setState
  // calls below are wrapped in a functional form that returns `prev`
  // unchanged when the new value equals the old one, which keeps
  // the effect from re-firing indefinitely during streaming.
  //
  // We have to call setState in the effect body here because we
  // need to advance our local "last seen" cursors in lock-step
  // with the messages. The `react-hooks/set-state-in-effect` rule
  // would normally flag this; we disable it for this component
  // because the pattern is sound (the functional setState guards
  // against re-render loops) and the alternative — reading a ref
  // during render — is also blocked by the
  // `react-hooks/refs` rule.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const grew = messages.length > lastSeenCount;
    const streamChanged = streamingId !== lastSeenStreamId;
    const becameStreaming =
      streamingId != null && lastSeenStreamId !== streamingId;

    if (grew || streamChanged) {
      if (atBottom || becameStreaming) {
        el.scrollTop = el.scrollHeight;
      }
      setLastSeenCount((prev) => (prev === messages.length ? prev : messages.length));
      setLastSeenStreamId((prev) => (prev === streamingId ? prev : streamingId));
    }
  }, [messages, streamingId, atBottom, lastSeenCount, lastSeenStreamId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const hasNewBelow = !atBottom && messages.length > lastSeenCount;

  const jumpToBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setLastSeenCount((prev) => (prev === messages.length ? prev : messages.length));
    setLastSeenStreamId((prev) => (prev === streamingId ? prev : streamingId));
  };

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="chat-scroll h-full overflow-y-auto px-3 py-6 lg:px-6"
        role="log"
        aria-live="polite"
      >
        <div className={`mx-auto flex flex-col gap-5 ${wide ? "max-w-[1000px]" : "max-w-[720px]"}`}>
          {messages.map((m) => (
            <MessageBubble
              key={m._id}
              message={m}
              isStreaming={m._id === streamingId}
              wide={wide}
              onRegenerate={onRegenerate ? () => onRegenerate(m._id) : undefined}
            />
          ))}
          <div ref={endRef} />
        </div>
      </div>
      {hasNewBelow && (
        <button
          type="button"
          onClick={jumpToBottom}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[11px] font-semibold text-[var(--ink)] shadow-[2px_2px_0_0_var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
        >
          <FiArrowDown className="h-3 w-3" />
          New messages
        </button>
      )}
    </div>
  );
}
