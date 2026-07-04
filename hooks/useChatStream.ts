"use client";

/**
 * useChatStream — owns the SSE stream for one conversation.
 *
 * The hook:
 *   1. Opens a POST /api/chats/{cid}/stream with the user content.
 *   2. Decodes SSE frames into `StreamEvent` and exposes a discriminated
 *      union to the consumer.
 *   3. Tracks streaming state (idle / sending / streaming / done / error / stopped)
 *      and the in-flight assistant message text (token-by-token).
 *   4. Surfaces an `AbortController` so the composer can stop generation.
 *
 * The hook is the single source of truth for "what does the chat look
 * like right now" — `useChatComposer` just hands it a user message and
 * reads back the streaming assistant text.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { streamPost } from "@/lib/sse";
import type { StreamEvent } from "@/lib/chatEvents";
import type { AgentStep, StreamStatus } from "@/types/chat";

// `StreamStatus` is re-exported so consumers that only have access to
// the hook module can import the type from one place.
export type { StreamStatus };

/**
 * `ReadableStream` doesn't implement `[Symbol.asyncIterator]` in the
 * default TS lib, so we polyfill a tiny one. Returns an async iterable
 * that yields chunks as they arrive.
 */
function readStream<T>(stream: ReadableStream<T>): AsyncIterable<T> {
  const reader = stream.getReader();
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          try {
            const { value, done } = await reader.read();
            return done ? { value: undefined, done: true } : { value, done: false };
          } catch (e) {
            reader.releaseLock();
            throw e;
          }
        },
        async return() {
          try { await reader.cancel(); } catch { /* noop */ }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

export interface UseChatStreamOptions {
  conversationId: string;
  /** Optional callback fired when a `done` event lands. */
  onDone?: (ev: Extract<StreamEvent, { type: "done" }>) => void;
  /** Optional callback fired when an `error` event lands. */
  onError?: (ev: Extract<StreamEvent, { type: "error" }>) => void;
}

export interface UseChatStreamReturn {
  status: StreamStatus;
  /** Token-by-token assistant content accumulated for the current turn. */
  streamingContent: string;
  /** Per-agent run state, surfaced in the steps panel. */
  steps: AgentStep[];
  /** Latest conflict query id raised by an agent during the run. */
  conflict: Extract<StreamEvent, { type: "conflict" }> | null;
  /** Last `done` event, retained until the next send. */
  lastDone: Extract<StreamEvent, { type: "done" }> | null;
  /** Send a user message and stream the assistant reply. */
  send: (content: string) => Promise<void>;
  /** Create a new conversation and stream the reply. Reports the new
   *  `conversationId` to `onCreated` as soon as the server emits it. */
  startNew: (
    content: string,
    opts: {
      workflowId?: string | null;
      onCreated: (conversationId: string) => void;
    },
  ) => Promise<void>;
  /** Abort the in-flight stream (sets status to `stopped`). */
  stop: () => void;
  /** Reset the hook to a clean state (e.g. when switching conversations). */
  reset: () => void;
  /** True while the assistant is generating. */
  isStreaming: boolean;
}

export function useChatStream(
  options: UseChatStreamOptions,
): UseChatStreamReturn {
  const { conversationId, onDone, onError } = options;
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [streamingContent, setStreamingContent] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [conflict, setConflict] = useState<Extract<
    StreamEvent,
    { type: "conflict" }
  > | null>(null);
  const [lastDone, setLastDone] = useState<Extract<
    StreamEvent,
    { type: "done" }
  > | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef<string | null>(null);
  // Keep latest callbacks in a ref so the `send` closure can read them
  // without re-binding on every render.
  const onDoneRef = useRef(onDone);
  const onErrorRef = useRef(onError);
  onDoneRef.current = onDone;
  onErrorRef.current = onError;

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    runIdRef.current = null;
    setStatus("idle");
    setStreamingContent("");
    setSteps([]);
    setConflict(null);
    setLastDone(null);
  }, []);

  // When the conversationId changes, drop any in-flight state.
  useEffect(() => {
    reset();
  }, [conversationId, reset]);

  // If the hook unmounts, abort any in-flight stream.
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("stopped");
  }, []);

  // Inner helper: drains a stream and updates the hook's state. Used by
  // both `send` (existing conversation) and `startNew` (create + stream).
  const drain = useCallback(
    async (stream: ReadableStream<StreamEvent>, controller: AbortController) => {
      let buffer = "";
      try {
        for await (const ev of readStream(stream)) {
          if (controller.signal.aborted) break;
          switch (ev.type) {
            case "ready":
              runIdRef.current = ev.runId;
              setStatus("streaming");
              break;
            case "step": {
              setSteps((prev) => {
                const idx = prev.findIndex((s) => s.agent === ev.name);
                if (idx === -1) {
                  return [
                    ...prev,
                    { agent: ev.name, status: ev.status as AgentStep["status"] },
                  ];
                }
                const next = prev.slice();
                next[idx] = {
                  agent: ev.name,
                  status: ev.status as AgentStep["status"],
                  content: next[idx].content,
                };
                return next;
              });
              break;
            }
            case "token":
              buffer += ev.delta;
              setStreamingContent(buffer);
              break;
            case "message":
              setSteps((prev) => {
                const idx = prev.findIndex((s) => s.agent === ev.agent);
                if (idx === -1) {
                  return [
                    ...prev,
                    { agent: ev.agent, status: "completed", content: ev.content },
                  ];
                }
                const next = prev.slice();
                next[idx] = {
                  agent: ev.agent,
                  status: "completed",
                  content: ev.content,
                };
                return next;
              });
              break;
            case "tool":
              // Tools are shown in the steps panel as a sub-line.
              break;
            case "conflict":
              setConflict(ev);
              break;
            case "done":
              setLastDone(ev);
              setStatus("done");
              setStreamingContent(ev.content);
              onDoneRef.current?.(ev);
              break;
            case "error":
              setStatus("error");
              onErrorRef.current?.(ev);
              break;
            case "stopped":
              setStatus("stopped");
              break;
          }
        }
        if (!controller.signal.aborted) {
          setStatus((prev) => (prev === "streaming" ? "done" : prev));
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setStatus("stopped");
        } else {
          setStatus("error");
          console.error("useChatStream error:", e);
          // Synthesize an error event so consumers (e.g. the empty-
          // state composer that navigates on error) get a single
          // hookup point — the `error` SSE event isn't reliable for
          // connection-level failures.
          onErrorRef.current?.({
            type: "error",
            message: (e as Error).message || "stream failed",
          });
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [],
  );

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      // Cancel any previous stream on the same hook.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus("sending");
      setStreamingContent("");
      setSteps([]);
      setConflict(null);
      setLastDone(null);
      runIdRef.current = null;

      const stream = streamPost<StreamEvent>(
        `/chats/${conversationId}/stream`,
        { content: trimmed },
        { signal: controller.signal },
      );
      await drain(stream, controller);
    },
    [conversationId, drain],
  );

  const startNew = useCallback(
    async (
      content: string,
      opts: {
        workflowId?: string | null;
        onCreated: (conversationId: string) => void;
      },
    ) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus("sending");
      setStreamingContent("");
      setSteps([]);
      setConflict(null);
      setLastDone(null);
      runIdRef.current = null;

      const stream = streamPost<StreamEvent>(
        `/chats/stream`,
        { content: trimmed, workflowId: opts.workflowId ?? null },
        { signal: controller.signal },
      );
      // Intercept the first `ready` event to surface the new id BEFORE
      // we start draining the rest of the stream.
      let newId: string | null = null;
      const reader = stream.getReader();
      const tap = new ReadableStream<StreamEvent>({
        async pull(c) {
          const { value, done } = await reader.read();
          if (done) {
            c.close();
            return;
          }
          if (newId == null && value.type === "ready" && value.conversationId) {
            newId = value.conversationId;
            opts.onCreated(value.conversationId);
          }
          c.enqueue(value);
        },
        cancel() {
          reader.cancel();
        },
      });
      await drain(tap, controller);
    },
    [drain],
  );

  return {
    status,
    streamingContent,
    steps,
    conflict,
    lastDone,
    send,
    startNew,
    stop,
    reset,
    isStreaming: status === "sending" || status === "streaming",
  };
}
