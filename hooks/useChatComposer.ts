"use client";

/**
 * useChatComposer / useChatNewComposer — own the composer state (text,
 * height, send button state) and orchestrate `useChatStream` for the
 * parent.
 *
 * Two variants:
 *   - `useChatComposer({ conversationId })` — sends to an existing chat.
 *   - `useChatNewComposer({ workflowId })` — creates a new conversation
 *     on first send. Reports the new `conversationId` via
 *     `onCreated(convId)` so the parent can update the URL.
 *
 * Both share the same `ComposerState` return shape (value, setValue,
 * submit, canSend, textareaRef, stream, stop) so the UI can be reused.
 *
 * Optimistic UX: when the user hits Send we add their message to the
 * parent's `messages` array immediately with status `complete`, then
 * start the SSE stream. As tokens arrive the parent updates the
 * streaming assistant message in place.
 */

import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type * as React from "react";

import { useChatStream, type UseChatStreamReturn } from "@/hooks/useChatStream";
import type { StreamEvent } from "@/lib/chatEvents";
import type { ChatMessage } from "@/types/chat";

const MAX_TEXTAREA_HEIGHT = 200; // px

export interface ComposerState {
  value: string;
  setValue: (next: string) => void;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  submit: () => Promise<void>;
  canSend: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  stream: UseChatStreamReturn;
  stop: () => void;
}

export interface UseChatComposerOptions {
  conversationId: string;
  /** Called right before the SSE stream starts. Use it to append the
   *  optimistic user message to the local message list. */
  onUserMessage?: (msg: ChatMessage) => void;
  /** Called every time the streaming assistant content updates. */
  onAssistantContent?: (content: string) => void;
  /** Called when the stream ends with a `done` event. */
  onStreamDone?: (ev: Extract<StreamEvent, { type: "done" }>) => void;
  /** Called on a stream error. */
  onStreamError?: (ev: Extract<StreamEvent, { type: "error" }>) => void;
  /** Optional pre-built stream. When provided, the composer uses it
   *  instead of creating its own `useChatStream`. This lets the
   *  parent share one stream between the composer and the rest of
   *  the UI (status pill, steps panel, Stop button). */
  stream?: UseChatStreamReturn;
}

export function useChatComposer(
  options: UseChatComposerOptions,
): ComposerState {
  const {
    conversationId,
    onUserMessage,
    onAssistantContent,
    onStreamDone,
    onStreamError,
    stream: externalStream,
  } = options;

  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const ownStream = useChatStream({
    conversationId,
    onDone: onStreamDone,
    onError: onStreamError,
  });
  // Use the external stream if the parent supplied one — that way the
  // parent's Stop button, status pill, and steps panel all observe
  // the same SSE controller the composer is using. Falling back to
  // the internal stream keeps this hook usable on its own.
  const stream = externalStream ?? ownStream;

  // Auto-grow the textarea up to MAX_TEXTAREA_HEIGHT.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const next = Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT);
    ta.style.height = `${next}px`;
  }, [value]);

  // Forward streaming content up to the parent. We keep the latest
  // callback in a ref so the effect only re-fires on actual content
  // changes (not on every parent re-render that creates a new
  // closure). Without the ref, `onAssistantContent` in the deps
  // would re-fire this effect on every parent render, which would
  // re-call setMessages in the parent, which would re-render the
  // parent, which would create a new closure, which would re-fire
  // the effect — a "Maximum update depth" loop.
  //
  // We also gate the forward on `stream.isStreaming` so a freshly-
  // mounted hook (status=idle, content="") does NOT immediately
  // push an empty streaming bubble into the parent's message list.
  // Without this guard, switching to a new /chats/{id} would render
  // a stray "Thinking..." row at the top before the user typed
  // anything. (The hook fires the effect once on mount with
  // streamingContent="", and the parent appends a streaming
  // assistant row with content="" → bubble shows ThinkingDots.)
  const onAssistantContentRef = useRef(onAssistantContent);
  useEffect(() => {
    onAssistantContentRef.current = onAssistantContent;
  });
  useEffect(() => {
    if (!stream.isStreaming) return;
    onAssistantContentRef.current?.(stream.streamingContent);
  }, [stream.isStreaming, stream.streamingContent]);

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || stream.isStreaming) return;
    const now = new Date().toISOString();
    const optimistic: ChatMessage = {
      _id: `optimistic-${Date.now()}`,
      conversationId,
      role: "user",
      content: trimmed,
      createdAt: now,
      status: "complete",
    };
    onUserMessage?.(optimistic);
    setValue("");
    const ta = textareaRef.current;
    if (ta) ta.style.height = "auto";
    await stream.send(trimmed);
  }, [value, stream, conversationId, onUserMessage]);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    [],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  return {
    value,
    setValue,
    onChange,
    onKeyDown,
    submit,
    canSend: value.trim().length > 0 && !stream.isStreaming,
    textareaRef,
    stream,
    stop: stream.stop,
  };
}

export interface UseChatNewComposerOptions {
  /** Workflow to bind to the new conversation (may be null). */
  workflowId?: string | null;
  /** Called as soon as the server creates the conversation. The
   *  parent uses this to update the URL (`router.replace`). */
  onCreated: (conversationId: string) => void;
  /** Called right before the SSE stream starts, with a synthetic
   *  `conversationId` placeholder (the real id is the one the
   *  `onCreated` callback will receive shortly after). */
  onUserMessage?: (msg: ChatMessage) => void;
  /** Called on every streaming content update. */
  onAssistantContent?: (content: string) => void;
  /** Called when the stream ends with a `done` event. */
  onStreamDone?: (ev: Extract<StreamEvent, { type: "done" }>) => void;
  /** Called on a stream error. */
  onStreamError?: (ev: Extract<StreamEvent, { type: "error" }>) => void;
  /** Optional controlled value. When provided the hook uses it as the
   *  textarea's value and reports user edits via `onValueChange`. */
  controlledValue?: string;
  onValueChange?: (next: string) => void;
  /** Notifies the parent of stream state changes so the empty state
   *  can show a streaming indicator above the composer. */
  onStreamStatusChange?: (status: { isStreaming: boolean; content: string }) => void;
}

export function useChatNewComposer(
  options: UseChatNewComposerOptions,
): ComposerState {
  const {
    workflowId,
    onCreated,
    onUserMessage,
    onAssistantContent,
    onStreamDone,
    onStreamError,
    controlledValue,
    onValueChange,
    onStreamStatusChange,
  } = options;

  const isControlled = typeof controlledValue === "string";
  const [internalValue, setInternalValue] = useState("");
  const value = isControlled ? (controlledValue as string) : internalValue;
  const setValue = useCallback(
    (next: string) => {
      if (isControlled) onValueChange?.(next);
      else setInternalValue(next);
    },
    [isControlled, onValueChange],
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  const stream = useChatStream({
    // The stream hook expects a non-empty conversationId; we use a
    // sentinel that will never match a real one. The actual id arrives
    // via the startNew `onCreated` callback before any token is shown.
    conversationId: "pending",
    onDone: (ev) => {
      // Defer the parent `onCreated` until the stream is fully done.
      // If we navigated during the stream, the hook would unmount and
      // the orchestrator's SSE connection would be aborted mid-flight,
      // leaving the user staring at an empty "Thinking..." bubble.
      const created = pendingIdRef.current;
      onStreamDone?.(ev);
      if (created) onCreated(created);
    },
    onError: (ev) => {
      // Navigate on error too — the conversation is already on the
      // server (with the user message persisted) so the user can see
      // the error state in context rather than being stranded on the
      // empty state with a disabled composer.
      const created = pendingIdRef.current;
      onStreamError?.(ev);
      if (created) onCreated(created);
    },
  });

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const next = Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT);
    ta.style.height = `${next}px`;
  }, [value]);

  // Use a ref for the callback so the effect only re-fires on
  // actual content changes (see the same pattern in
  // `useChatComposer` above). The `isStreaming` gate prevents an
  // idle hook from pushing an empty assistant bubble into the
  // parent's list on mount (which would show "Thinking..." with
  // no actual stream in flight).
  const onAssistantContentRef = useRef(onAssistantContent);
  useEffect(() => {
    onAssistantContentRef.current = onAssistantContent;
  });
  useEffect(() => {
    if (!stream.isStreaming) return;
    onAssistantContentRef.current?.(stream.streamingContent);
  }, [stream.isStreaming, stream.streamingContent]);

  // Bubble stream status up to the parent so it can render an
  // indicator (the empty state shows a streaming preview while the
  // first turn is in flight).
  const onStreamStatusRef = useRef(onStreamStatusChange);
  useEffect(() => {
    onStreamStatusRef.current = onStreamStatusChange;
  });
  useEffect(() => {
    onStreamStatusRef.current?.({
      isStreaming: stream.isStreaming,
      content: stream.streamingContent,
    });
  }, [stream.isStreaming, stream.streamingContent]);

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || stream.isStreaming) return;
    setValue("");
    const ta = textareaRef.current;
    if (ta) ta.style.height = "auto";
    pendingIdRef.current = null;
    // Optimistic insert BEFORE we know the conversation id. The shell
    // uses a placeholder id (the stream will reconcile once `ready`
    // arrives); this is fine because the conversation is created in
    // the same call and the load effect on /chats/{id} will replace
    // any optimistic rows with server-truth.
    onUserMessage?.({
      _id: `optimistic-${Date.now()}`,
      conversationId: "pending",
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
      status: "complete",
    });
    await stream.startNew(trimmed, {
      workflowId: workflowId ?? null,
      onCreated: (newId) => {
        // Stash the id; we navigate on `done` (see `onDone` above).
        pendingIdRef.current = newId;
      },
    });
    // `onCreated` is intentionally NOT in the dep list — it's
    // captured inside the `onDone` wrapper that `useChatStream`
    // keeps in a ref, so the latest closure is always used.
  }, [value, stream, workflowId, onUserMessage, setValue]);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  return {
    value,
    setValue,
    onChange,
    onKeyDown,
    submit,
    canSend: value.trim().length > 0 && !stream.isStreaming,
    textareaRef,
    stream,
    stop: stream.stop,
  };
}
