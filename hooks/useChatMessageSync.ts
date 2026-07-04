"use client";

/**
 * useChatMessageSync — listens to cross-tab `message:new` /
 * `message:updated` WS events and applies them to the active chat
 * screen's `messages` state.
 *
 * Why a separate hook from `useChatStream`? `useChatStream` owns the
 * SSE for the current send, but cross-tab events arrive over the
 * per-user WebSocket that `useChatSidebar` owns. This hook bridges
 * that gap by listening to the custom DOM event `useChatSidebar`
 * dispatches.
 *
 * The hook is a no-op when `conversationId` is null. Callers don't
 * need to gate the hook themselves; it does the right thing.
 *
 * Why not call `useChatSidebar()` here? `useChatSidebar` is already
 * mounted (in `ChatShell` and `ChatSidebar`); opening yet another
 * instance would create a third WebSocket. The custom event is the
 * single fan-out point.
 */

import { useEffect, useRef } from "react";

import type { ChatMessage } from "@/types/chat";

export interface ChatMessageSyncEventDetail {
  conversationId: string;
  message: ChatMessage;
  kind: "message:new" | "message:updated";
}

export function useChatMessageSync(
  conversationId: string | null,
  onMessage: (detail: ChatMessageSyncEventDetail) => void,
): void {
  const onMessageRef = useRef(onMessage);
  // The ref must be updated in an effect so the rule that bans
  // "writing to a ref during render" stays happy. The effect runs
  // after the render commits; the latest closure is in place by the
  // time a WS event can fire.
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!conversationId) return;
    function handler(ev: Event) {
      const detail = (ev as CustomEvent<ChatMessageSyncEventDetail>).detail;
      if (!detail || detail.conversationId !== conversationId) return;
      onMessageRef.current(detail);
    }
    window.addEventListener("chat:message", handler as EventListener);
    return () => {
      window.removeEventListener("chat:message", handler as EventListener);
    };
  }, [conversationId]);
}