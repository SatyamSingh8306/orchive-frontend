"use client";

/**
 * useChatShortcuts — installs global keyboard shortcuts for the chat
 * surface.
 *
 *   ⌘K / Ctrl+K  → focus the sidebar search (if `searchRef` given)
 *   ⌘N / Ctrl+N  → invoke the new-chat callback (if `onNewChat` given)
 *   Esc          → invoke the cancel callback (if `onCancel` given).
 *                  Used by the composer to stop a running stream.
 *
 * Shortcuts are skipped when the user is typing in an input/textarea
 * (except Escape, which we always handle so users can stop a stream
 * from anywhere).
 */

import { useEffect, type RefObject } from "react";

export interface UseChatShortcutsOptions {
  onNewChat?: () => void;
  onCancel?: () => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useChatShortcuts(opts: UseChatShortcutsOptions): void {
  const { onNewChat, onCancel, searchRef } = opts;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘N / Ctrl+N → new chat (skip while typing)
      if (mod && (e.key === "n" || e.key === "N")) {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        onNewChat?.();
        return;
      }

      // ⌘K / Ctrl+K → focus search (skip while typing in a non-search field)
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        searchRef?.current?.focus();
        return;
      }

      // Esc → cancel / stop stream (always handled)
      if (e.key === "Escape") {
        onCancel?.();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewChat, onCancel, searchRef]);
}
