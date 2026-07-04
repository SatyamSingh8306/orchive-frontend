"use client";

/**
 * useChatSidebar — owns the sidebar list of conversations and the
 * per-user WebSocket that keeps it in sync across tabs.
 *
 * The hook:
 *   1. Fetches the conversation list on mount via `GET /api/chats`.
 *   2. Opens a single WebSocket to `/api/ws/chats`, passing the JWT via
 *      the `Sec-WebSocket-Protocol: bearer.<token>` subprotocol.
 *   3. Subscribes to `conversation:new|updated|deleted` and
 *      `message:new|updated` events; mutates the local list to keep
 *      it in sync without a refetch.
 *   4. Exposes CRUD: `create`, `rename`, `pin`, `remove`.
 *
 * The hook is the single source of truth for "what's in the sidebar
 * right now." Components consume it via the returned helpers; they
 * never fetch the list themselves.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import api from "@/lib/axios";
import type { ChatWSEvent } from "@/lib/chatEvents";
import type { ChatMessage, Conversation } from "@/types/chat";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

function resolveWsBase(): string {
  // Same env var as axios.ts but we need the bare origin (no /api).
  const fromEnv = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
  const base = fromEnv && fromEnv.length > 0
    ? fromEnv
    : "http://localhost:8000/api";
  // Strip trailing /api if present so the WS URL is at the root origin.
  return base.replace(/\/api\/?$/, "");
}

export interface UseChatSidebarReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  /** Create a new conversation. Returns the new conversation. */
  create: (workflowId?: string | null, title?: string | null) => Promise<Conversation | null>;
  rename: (id: string, title: string) => Promise<void>;
  pin: (id: string, pinned: boolean) => Promise<void>;
  /** Bind (or rebind) the conversation to a workflow. Pass `null` to clear. */
  setWorkflow: (id: string, workflowId: string | null) => Promise<Conversation | null>;
  remove: (id: string) => Promise<void>;
  /** Soft-delete every non-deleted conversation for the user. */
  removeAll: () => Promise<number>;
  /** Hard-delete every conversation (and its messages) for the user. */
  purgeAll: () => Promise<number>;
  search: (query: string) => Promise<Conversation[]>;
  /** Reload the list from the server. */
  refresh: () => Promise<void>;
  /** Manually push a `message:new|updated` into the latest-message cache. */
  applyMessage: (conversationId: string, message: ChatMessage) => void;
}

export function useChatSidebar(): UseChatSidebarReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);

  // ---- list fetching ------------------------------------------------

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ conversations: Conversation[]; total: number }>(
        "/chats",
        { params: { limit: 100 } },
      );
      setConversations(data.conversations ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- websocket ----------------------------------------------------

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const token = getToken();
      if (!token) {
        // Auth not ready yet — try again in a moment.
        reconnectRef.current = window.setTimeout(connect, 1000);
        return;
      }

      const base = resolveWsBase();
      const url = `${base.replace(/^http/, "ws")}/api/ws/chats`;
      try {
        const ws = new WebSocket(url, ["bearer." + token]);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          reconnectAttemptRef.current = 0;
        };
        ws.onclose = () => {
          setIsConnected(false);
          wsRef.current = null;
          if (cancelled) return;
          // Exponential backoff capped at 15s.
          reconnectAttemptRef.current = Math.min(reconnectAttemptRef.current + 1, 5);
          const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, 15000);
          reconnectRef.current = window.setTimeout(connect, delay);
        };
        ws.onerror = () => {
          // onclose will follow; just let the backoff handle it.
        };
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data) as ChatWSEvent;
            switch (data.type) {
              case "connected":
                setIsConnected(true);
                break;
              case "conversation:new":
                setConversations((prev) => {
                  if (prev.some((c) => c._id === data.conversation._id)) return prev;
                  return [data.conversation, ...prev];
                });
                break;
              case "conversation:updated":
                setConversations((prev) =>
                  prev.map((c) =>
                    c._id === data.conversation._id ? data.conversation : c,
                  ),
                );
                break;
              case "conversation:deleted":
                if (data.conversationId === "*") {
                  // Bulk-delete broadcast — drop the entire list.
                  setConversations((prev) => (prev.length === 0 ? prev : []));
                  break;
                }
                setConversations((prev) =>
                  prev.filter((c) => c._id !== data.conversationId),
                );
                break;
              case "message:new":
              case "message:updated":
                applyMessageLocal(data.conversationId, data.message);
                // Also notify any chat screen that has this
                // conversation open. Without this, a user on chat X
                // in tab A who streams a message would NOT see the
                // updates in tab B (the WS event would only update
                // the sidebar's preview). The chat screen listens
                // via `useChatMessageSync` below.
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("chat:message", {
                      detail: {
                        conversationId: data.conversationId,
                        message: data.message,
                        kind: data.type,
                      },
                    }),
                  );
                }
                break;
            }
          } catch {
            /* ignore malformed */
          }
        };
      } catch (e) {
        console.warn("WS connect failed:", e);
        reconnectRef.current = window.setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      try { wsRef.current?.close(); } catch { /* noop */ }
      wsRef.current = null;
    };
  }, []);

  // Keep a stable ref to applyMessage so the WS handler can use it
  // without re-binding.
  const applyMessage = useCallback(
    (conversationId: string, message: ChatMessage) => {
      applyMessageLocal(conversationId, message);
    },
    [],
  );

  function applyMessageLocal(conversationId: string, message: ChatMessage) {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c._id === conversationId);
      if (idx === -1) return prev;
      const updated: Conversation = {
        ...prev[idx],
        lastMessageAt: message.createdAt,
        lastMessagePreview: (message.content || "").slice(0, 120),
        messageCount: Math.max(prev[idx].messageCount ?? 0, 0) + (message.role === "user" ? 1 : 0),
      };
      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
  }

  // ---- mutations ----------------------------------------------------

  const create = useCallback(
    async (
      workflowId?: string | null,
      title?: string | null,
    ): Promise<Conversation | null> => {
      try {
        const body: Record<string, unknown> = {};
        if (workflowId) body.workflowId = workflowId;
        if (title) body.title = title;
        const { data } = await api.post<Conversation>("/chats", body);
        setConversations((prev) => {
          if (prev.some((c) => c._id === data._id)) return prev;
          return [data, ...prev];
        });
        return data;
      } catch (e) {
        setError((e as Error).message);
        return null;
      }
    },
    [],
  );

  const rename = useCallback(async (id: string, title: string) => {
    try {
      const { data } = await api.patch<Conversation>(`/chats/${id}`, { title });
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? data : c)),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const pin = useCallback(async (id: string, pinned: boolean) => {
    try {
      const { data } = await api.patch<Conversation>(`/chats/${id}`, { pinned });
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? data : c)),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const setWorkflow = useCallback(
    async (id: string, workflowId: string | null): Promise<Conversation | null> => {
      try {
        const { data } = await api.patch<Conversation>(`/chats/${id}`, {
          workflowId,
        });
        setConversations((prev) =>
          prev.map((c) => (c._id === id ? data : c)),
        );
        return data;
      } catch (e) {
        setError((e as Error).message);
        return null;
      }
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    try {
      await api.delete(`/chats/${id}`);
      setConversations((prev) => prev.filter((c) => c._id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const removeAll = useCallback(async (): Promise<number> => {
    try {
      const { data } = await api.delete<{ ok: boolean; deleted: number }>("/chats");
      // Optimistically clear locally; the WS will also broadcast a
      // wildcard `conversation:deleted` for the other tabs.
      setConversations((prev) => (prev.length === 0 ? prev : []));
      return data.deleted ?? 0;
    } catch (e) {
      setError((e as Error).message);
      return 0;
    }
  }, []);

  const purgeAll = useCallback(async (): Promise<number> => {
    try {
      const { data } = await api.delete<{ ok: boolean; deleted: number }>("/chats", {
        params: { purge: true },
      });
      setConversations((prev) => (prev.length === 0 ? prev : []));
      return data.deleted ?? 0;
    } catch (e) {
      setError((e as Error).message);
      return 0;
    }
  }, []);

  const search = useCallback(
    async (query: string): Promise<Conversation[]> => {
      try {
        const { data } = await api.get<{ conversations: Conversation[] }>(
          "/chats",
          { params: { q: query, limit: 30 } },
        );
        return data.conversations ?? [];
      } catch {
        return [];
      }
    },
    [],
  );

  return useMemo(
    () => ({
      conversations,
      loading,
      error,
      isConnected,
      create,
      rename,
      pin,
      setWorkflow,
      remove,
      removeAll,
      purgeAll,
      search,
      refresh,
      applyMessage,
    }),
    [conversations, loading, error, isConnected, create, rename, pin, setWorkflow, remove, removeAll, purgeAll, search, refresh, applyMessage],
  );
}
