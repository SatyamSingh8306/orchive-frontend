/**
 * Tiny SSE client for `POST /api/chats/{cid}/stream`.
 *
 * `EventSource` only does GET, but the chat route needs POST (to send
 * the user message in the body) plus a `Bearer` header (no token in
 * the query string). So we open a `fetch()` with `responseType:
 * "stream"`, read the body chunk by chunk, and parse SSE frames
 * ourselves. The result is a `ReadableStream<StreamEvent>` that the
 * caller can `for await` over.
 *
 * Usage:
 *
 *   const stream = streamPost<StreamEvent>('/api/chats/abc/stream',
 *                                          { content: 'hi' });
 *   for await (const ev of stream) {
 *     switch (ev.type) { ... }
 *   }
 *
 * Auth: attaches the JWT from localStorage, same as the global axios
 * instance. Caller is responsible for the `AbortSignal` if the user
 * clicks "Stop" mid-stream.
 */

import type { StreamEvent } from "@/lib/chatEvents";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

function resolveBaseURL(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
  return fromEnv && fromEnv.length > 0
    ? fromEnv
    : "http://localhost:8000/api";
}

export interface StreamOptions {
  signal?: AbortSignal;
  /** Called once per parsed frame. Use for side effects (e.g. log). */
  onFrame?: (raw: string) => void;
}

function parseFrames(buffer: string): { events: string[]; rest: string } {
  // SSE frames are separated by a blank line (`\n\n`). We split on
  // `\n\n`, ignore the trailing partial frame, and return the rest.
  const events: string[] = [];
  let rest = buffer;
  let idx: number;
  while ((idx = rest.indexOf("\n\n")) !== -1) {
    const frame = rest.slice(0, idx);
    rest = rest.slice(idx + 2);
    if (frame.trim()) events.push(frame);
  }
  return { events, rest };
}

function extractData(frame: string): string | null {
  // A frame can have many `field: value` lines. We only care about
  // `data:`; everything else (event:, id:, retry:, etc.) is ignored.
  const lines = frame.split(/\r?\n/);
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data:")) {
      // Allow `data: foo` and `data:foo` (the leading space is optional
      // per spec). Strip exactly one leading space if present.
      const payload = line.length > 5 && line[5] === " " ? line.slice(6) : line.slice(5);
      dataLines.push(payload);
    }
  }
  return dataLines.length > 0 ? dataLines.join("\n") : null;
}

export function streamPost<TEvent>(
  path: string,
  body: unknown,
  options: StreamOptions = {},
): ReadableStream<TEvent> {
  const url = path.startsWith("http")
    ? path
    : `${resolveBaseURL()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  const decoder = new TextDecoder("utf-8");

  const stream = new ReadableStream<TEvent>({
    async start(controller) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: options.signal ?? null,
        });
      } catch (e) {
        controller.error(e);
        return;
      }
      if (!res.ok || !res.body) {
        const err = new Error(`SSE: HTTP ${res.status}`);
        (err as Error & { status?: number }).status = res.status;
        controller.error(err);
        return;
      }
      reader = res.body.getReader();
      let buffer = "";
      const onAbort = () => {
        try { reader?.cancel(); } catch { /* noop */ }
        try { controller.close(); } catch { /* noop */ }
      };
      options.signal?.addEventListener("abort", onAbort);
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = parseFrames(buffer);
          buffer = rest;
          for (const frame of events) {
            options.onFrame?.(frame);
            const data = extractData(frame);
            if (data == null) continue;
            try {
              controller.enqueue(JSON.parse(data) as TEvent);
            } catch (e) {
              // Drop malformed frames; keep the stream alive.
              console.warn("SSE: failed to parse frame", data, e);
            }
          }
        }
        // Flush any final partial buffer.
        if (buffer.trim()) {
          const data = extractData(buffer);
          if (data != null) {
            try { controller.enqueue(JSON.parse(data) as TEvent); } catch { /* noop */ }
          }
        }
        controller.close();
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          try { controller.close(); } catch { /* noop */ }
          return;
        }
        controller.error(e);
      } finally {
        options.signal?.removeEventListener("abort", onAbort);
      }
    },
    cancel() {
      try { reader?.cancel(); } catch { /* noop */ }
    },
  });

  return stream;
}

/** Convenience type guard for stream events. */
export function isStreamEvent(value: unknown): value is StreamEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
