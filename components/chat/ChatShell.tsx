"use client";

/**
 * ChatShell — the layout shell for the new /chats surface.
 *
 * Layout (desktop, ≥1024px):
 *   ┌────────┬────────────────────────────┐
 *   │Sidebar │ Header (title · workflow)  │
 *   │        ├────────────────────────────┤
 *   │        │ MessageList                 │
 *   │        │                             │
 *   │        ├────────────────────────────┤
 *   │        │ ChatComposer                │
 *   └────────┴────────────────────────────┘
 *
 * On mobile (<1024px) the sidebar collapses to a 12px toggle column
 * (matching the existing AppShell pattern). The `ChatSidebar` already
 * supports its own collapsed state.
 *
 * Two render paths:
 *   1. `conversationId == null` — landing / new chat. The right pane
 *      shows `ChatEmptyState`, which contains its own `ChatComposer` in
 *      `mode="new"`. Prompt buttons fill the composer's textarea (do
 *      NOT create a conversation). On Send the server creates a
 *      conversation (using `defaultWorkflowId`) and we `router.replace`
 *      to `/chats/{id}`.
 *   2. `conversationId != null` — load the conversation + messages,
 *      render the standard chat screen. The workflow badge in the
 *      header is a dropdown that calls PATCH /api/chats/{id} to rebind
 *      the conversation (the *next* user turn uses the new binding).
 *
 * The "+" button (sidebar) and ⌘N shortcut open `WorkflowPickerDialog`,
 * which lets the user pick a workflow (or "default agents"). On
 * confirm we create an empty conversation bound to the picked
 * workflow and navigate to `/chats/{id}`.
 *
 * The shell owns the chat state — a single conversationId at a time —
 * and forwards it down to the message list, composer, and (optional)
 * agent-steps panel. The pages (`/chats`, `/chats/new`,
 * `/chats/[id]`) decide which conversationId to pass.
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCpu } from "react-icons/fi";

import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import AgentStepsPanel from "./AgentStepsPanel";
import ChatEmptyState from "./ChatEmptyState";
import WorkflowPickerDialog from "./WorkflowPickerDialog";
import type { ChatMessage, Conversation, WorkflowOption } from "@/types/chat";
import type { StreamEvent } from "@/lib/chatEvents";
import { useChatShortcuts } from "@/hooks/useChatShortcuts";
import { useChatStream } from "@/hooks/useChatStream";
import { useChatMessageSync } from "@/hooks/useChatMessageSync";
import api from "@/lib/axios";
import { useChatSidebar } from "@/hooks/useChatSidebar";

export interface ChatShellProps {
  conversationId: string | null;
}

export default function ChatShell({ conversationId }: ChatShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sidebar = useChatSidebar();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [workflowName, setWorkflowName] = useState<string | null>(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  // Composer seed for the empty-state composer. Prompt buttons call
  // `onSelectPrompt(p)` which calls `setEmptyStateValue(p)` to fill the
  // textarea. The composer reports user edits back via
  // `onComposerValueChange`. The text is owned by ChatShell so it
  // survives across the suggestion buttons.
  const [emptyStateValue, setEmptyStateValue] = useState<string>("");
  // Live stream status for the empty-state composer. Reported by
  // `useChatNewComposer` via `onStreamStatusChange`. Used to render
  // a "streaming" indicator above the composer so the user has
  // feedback while the first turn is in flight.
  const [emptyStateStream, setEmptyStateStream] = useState<{ isStreaming: boolean; content: string }>({
    isStreaming: false,
    content: "",
  });
  // The workflow picker dialog. Triggered by the sidebar "+" button
  // and the ⌘N shortcut. The user picks a workflow (or "default
  // agents"), the parent creates an empty conversation bound to it,
  // then navigates to /chats/{id}.
  const [pickerOpen, setPickerOpen] = useState(false);
  // Workflow list — used by the picker dialog and the chat header
  // rebind dropdown.
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  // The user's first workflow — used as the default selection in
  // the picker dialog and as `defaultWorkflowId` for the empty-state
  // composer. Fetched once on mount.
  const [defaultWorkflowId, setDefaultWorkflowId] = useState<string | null>(null);
  // Whether the sidebar is collapsed. Mirrored from ChatSidebar via
  // `onCollapsedChange`. When true, widen the message + composer
  // columns so long replies don't look cramped in the extra space.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Per-conversation stream state. When conversationId is null we
  // still mount the hook (it just sits in `idle`); the consumer
  // gates the UI on `conversationId`.
  const stream = useChatStream({ conversationId: conversationId ?? "" });

  // Fetch the workflow list once on mount. Used by the picker dialog
  // and the chat header rebind dropdown.
  //
  // Note: `GET /api/workflows` returns a BARE ARRAY (see
  // `app/routes/workflows.py:list_`), not an object wrapper. The
  // `workflows` array may also have `id: null` if a doc is malformed
  // — we filter those out before showing them in the UI.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<Array<{
          id?: string | null;
          _id?: string;
          name: string;
        }>>("/workflows", { params: { limit: 50 } });
        if (cancelled) return;
        const raw = Array.isArray(data) ? data : [];
        const opts: WorkflowOption[] = raw
          .map((w) => ({
            id: w.id ?? w._id,
            name: w.name,
          }))
          .filter((w): w is WorkflowOption => typeof w.id === "string" && w.id.length > 0);
        setWorkflows(opts);
        setDefaultWorkflowId((prev) => prev ?? opts[0]?.id ?? null);
      } catch {
        /* noop — empty list is fine */
      } finally {
        if (!cancelled) setWorkflowsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Watch `?new=1` — when the user clicks "+" on a chat screen we
  // navigate to `/chats?new=1` so the empty state mounts cleanly
  // (no leftover stream from the previous chat) and the picker
  // opens automatically. Strip the param after consuming it so a
  // page reload of /chats?new=1 doesn't keep popping the picker.
  useEffect(() => {
    if (searchParams?.get("new") === "1") {
      setPickerOpen(true);
      // Remove the query param without triggering a navigation
      // (we're already on /chats).
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Load conversation + messages when conversationId changes.
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    setConversation(null);  // clear stale state when switching
    (async () => {
      try {
        const { data } = await api.get<{ conversation: Conversation; messages: ChatMessage[] }>(
          `/chats/${conversationId}`,
        );
        if (cancelled) return;
        setConversation(data.conversation);
        // Dedupe loaded messages. Three layers of defense:
        //   1. Same `_id` anywhere in the list — patch in place.
        //   2. Empty placeholder adjacent to a real message of the
        //      same role — drop the placeholder.
        //   3. Two consecutive non-empty messages with identical
        //      role+content within a 5s window — keep the newer one
        //      (a real user repeat-question 30s later stays).
        const rawMsgs = data.messages ?? [];
        const byId = new Map<string, (typeof rawMsgs)[number]>();
        for (const m of rawMsgs) {
          if (m._id) byId.set(m._id, m);
        }
        const deduped: typeof rawMsgs = [];
        for (const m of byId.values()) {
          const prev = deduped[deduped.length - 1];
          if (prev) {
            const sameRoleContent = prev.role === m.role && prev.content === m.content;
            const emptyPlaceholder =
              (m.content.length === 0 && m.role === "assistant") ||
              (prev.content.length === 0 && prev.role === "assistant");
            const recentDuplicate =
              sameRoleContent &&
              m.content.length > 0 &&
              Math.abs(
                new Date(m.createdAt).getTime() -
                  new Date(prev.createdAt).getTime(),
              ) < 5_000;
            if (emptyPlaceholder || recentDuplicate) {
              continue;
            }
          }
          deduped.push(m);
        }
        setMessages(deduped);
        if (data.conversation.workflowId) {
          try {
            const wf = await api.get<{ id: string; name: string }>(
              `/workflows/${data.conversation.workflowId}`,
            );
            if (!cancelled) setWorkflowName(wf.data.name);
          } catch {
            if (!cancelled) setWorkflowName(null);
          }
        } else {
          setWorkflowName(null);
        }
      } catch (e: any) {
        // 404 means the conversation doesn't exist on the server
        // (Mongo wiped, stale URL from history, or different user).
        // Drop the URL and bounce back to /chats so the user can
        // start a fresh chat instead of staring at a blank screen.
        const status = e?.response?.status;
        if (status === 404) {
          console.warn("conversation not found, redirecting:", conversationId);
          router.replace("/chats");
          return;
        }
        console.error("failed to load conversation:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, router]);

  // ─── New chat handlers ────────────────────────────────────────────

  // "+" button (sidebar) or ⌘N → open the picker dialog.
  //
  // If we're on a chat screen with an in-flight stream, we navigate
  // to `/chats?new=1` so the empty state opens and the picker shows
  // on top of it. The `?new=1` query param is consumed by the empty
  // state below to auto-open the picker once. After the user
  // confirms (or cancels) the param is removed so a normal
  // `/chats` visit doesn't pop the picker.
  const openNewChatPicker = () => {
    if (conversationId) {
      router.push("/chats?new=1");
    } else {
      setPickerOpen(true);
    }
  };

  // User confirmed in the picker. Create an empty conversation with
  // the picked workflow (or no workflow) and navigate to it. The
  // empty state already showed (the picker was opened from /chats
  // or we navigated to /chats?new=1 first), so we don't need to
  // navigate again before creating.
  const handlePickerConfirm = async (workflowId: string | null) => {
    setPickerOpen(false);
    const conv = await sidebar.create(workflowId);
    if (conv?._id) {
      router.replace(`/chats/${conv._id}`);
    }
    // If `create` returned null we stay on /chats; the user can type
    // into the composer and a new chat will be created on send.
  };

  useChatShortcuts({
    onNewChat: () => openNewChatPicker(),
  });

  // ─── Optimistic message handling ──────────────────────────────────

  const onUserMessage = (msg: ChatMessage) => {
    setMessages((prev) => {
      // Mark any in-flight streaming assistant messages as stopped —
      // the user is moving on with a new turn. Without this, stale
      // placeholders from an interrupted previous stream keep showing
      // a "Streaming…" footer forever.
      const next = prev.map((m) =>
        m.status === "streaming" ? { ...m, status: "stopped" as const } : m,
      );
      // Defensive: don't add a duplicate user message if one with
      // the same content was already added in the last few messages
      // (covers a double-Enter / double-click on Send that slipped
      // past the disabled-button guard).
      for (let i = next.length - 1; i >= 0 && i >= next.length - 4; i--) {
        if (next[i].role === "user" && next[i].content === msg.content) {
          return next;
        }
      }
      return [...next, msg];
    });
  };

  const onAssistantContent = (content: string) => {
    setMessages((prev) => {
      const lastIdx = (() => {
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === "assistant" && prev[i].status === "streaming") return i;
        }
        return -1;
      })();
      if (lastIdx === -1) {
        if (!conversationId) return prev;
        // Don't append a new streaming bubble if the most recent
        // message is already a non-empty assistant turn. That means
        // a previous turn completed but its bubble wasn't reconciled
        // (e.g. cross-tab sync landed after onStreamDone, or a stale
        // SSE event fired post-done). Appending here would render the
        // same answer twice in the chat.
        const last = prev[prev.length - 1];
        if (
          last &&
          last.role === "assistant" &&
          last.content.length > 0
        ) {
          return prev;
        }
        // Idempotent: if the last message already has this content,
        // don't return a new array. The streaming effect will fire
        // again with the same `content` because the parent's
        // `onAssistantContent` is a fresh closure each render, and
        // returning `prev` here is what stops the cascade.
        if (
          prev.length > 0 &&
          prev[prev.length - 1].role === "assistant" &&
          prev[prev.length - 1].content === content
        ) {
          return prev;
        }
        const newMsg: ChatMessage = {
          _id: `stream-${Date.now()}`,
          conversationId,
          role: "assistant",
          content,
          createdAt: new Date().toISOString(),
          status: "streaming",
        };
        return [...prev, newMsg];
      }
      if (prev[lastIdx].content === content) return prev;
      const next = prev.slice();
      next[lastIdx] = { ...next[lastIdx], content };
      return next;
    });
  };

  const onStreamDone = (ev: Extract<StreamEvent, { type: "done" }>) => {
    setMessages((prev) => {
      const lastIdx = (() => {
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === "assistant" && prev[i].status === "streaming") return i;
        }
        return -1;
      })();
      if (lastIdx === -1) return prev;
      const next = prev.slice();
      // Prefer the streaming-accumulated content the user has been
      // watching. Only fall back to ev.content if the streaming
      // buffer is empty (defensive — shouldn't happen on the happy
      // path). This avoids a sudden reformat when the orchestrator's
      // synthesized "done" content differs slightly from the raw
      // token stream (whitespace, <think> strip, etc.).
      const nextContent =
        next[lastIdx].content.length > 0 ? next[lastIdx].content : ev.content;
      next[lastIdx] = {
        ...next[lastIdx],
        content: nextContent,
        status: "complete",
        runId: ev.runId,
        agentResults: ev.agentResults,
        durationMs: ev.durationMs,
      };
      return next;
    });
  };

  const onStreamError = (ev: Extract<StreamEvent, { type: "error" }>) => {
    setMessages((prev) => {
      const lastIdx = (() => {
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === "assistant" && prev[i].status === "streaming") return i;
        }
        return -1;
      })();
      if (lastIdx === -1) return prev;
      const next = prev.slice();
      next[lastIdx] = {
        ...next[lastIdx],
        content: ev.message || "(error)",
        status: "error",
      };
      return next;
    });
  };

  // Cross-tab message sync. When another tab streams a message into
  // the conversation that's open here, the per-user WebSocket
  // delivers a `message:new` / `message:updated` event. The hook
  // listens via the custom DOM event `useChatSidebar` dispatches; we
  // reconcile it with the local `messages` array.
  const onSyncMessage = (detail: {
    conversationId: string;
    message: ChatMessage;
    kind: "message:new" | "message:updated";
  }) => {
    setMessages((prev) => {
      // Exact _id match — patch in place.
      const idx = prev.findIndex((m) => m._id === detail.message._id);
      if (idx !== -1) {
        const next = prev.slice();
        next[idx] = detail.message;
        return next;
      }
      // Dedupe: a server echo of a user message that we already
      // optimistically inserted will have a different _id (server
      // uses ObjectId, optimistic uses "optimistic-..."). Match by
      // role + content + the optimistic prefix on the local copy.
      // For assistant placeholders the server _id is the only
      // canonical one — but the local streaming bubble itself uses a
      // synthetic `stream-...` id (see onAssistantContent), so we can
      // dedupe that against the incoming canonical copy the same way.
      if (detail.message.role === "user") {
        const dupIdx = prev.findIndex(
          (m) =>
            m.role === "user" &&
            m.content === detail.message.content &&
            m._id.startsWith("optimistic-"),
        );
        if (dupIdx !== -1) {
          // Replace the optimistic copy with the server's canonical
          // version so future updates (status flips, content edits)
          // patch the right row.
          const next = prev.slice();
          next[dupIdx] = detail.message;
          return next;
        }
      }
      if (detail.message.role === "assistant") {
        // Match the local streaming placeholder by its synthetic id
        // prefix, not by content — by the time the sync event lands
        // the local copy may already be `status: "complete"` (set by
        // onStreamDone), and content can differ by trailing
        // whitespace/think-tag stripping vs. the server's copy.
        const dupIdx = prev.findIndex(
          (m) => m.role === "assistant" && m._id.startsWith("stream-"),
        );
        if (dupIdx !== -1) {
          const next = prev.slice();
          next[dupIdx] = detail.message;
          return next;
        }
      }
      // New message — append.
      return [...prev, detail.message];
    });
  };
  useChatMessageSync(conversationId, onSyncMessage);

  // ─── Workflow rebind from the chat header ──────────────────────────

  const handleSetWorkflow = async (newWorkflowId: string | null) => {
    if (!conversationId) return;
    const updated = await sidebar.setWorkflow(conversationId, newWorkflowId);
    if (updated) {
      setConversation(updated);
      if (updated.workflowId) {
        const wf = workflows.find((w) => w.id === updated.workflowId);
        setWorkflowName(wf?.name ?? null);
      } else {
        setWorkflowName(null);
      }
    }
  };

  // ─── Sidebar / message-list glue ──────────────────────────────────

  const streamingMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].status === "streaming") return messages[i]._id;
    }
    return null;
  })();

  // ─── Render ───────────────────────────────────────────────────────

  const sidebarEl = (activeId: string | null) => (
    <ChatSidebar
      activeId={activeId}
      onNewChat={() => openNewChatPicker()}
      onCollapsedChange={setSidebarCollapsed}
    />
  );

  const pickerEl = (
    <WorkflowPickerDialog
      key={pickerOpen ? "open" : "closed"}
      open={pickerOpen}
      workflows={workflows}
      loading={workflowsLoading}
      defaultWorkflowId={defaultWorkflowId}
      onConfirm={(wfId) => void handlePickerConfirm(wfId)}
      onClose={() => setPickerOpen(false)}
    />
  );

  if (!conversationId) {
    return (
      <div className="flex h-[calc(100vh-0px)] bg-[var(--paper)]">
        {sidebarEl(null)}
        <main className="flex-1 overflow-hidden">
          <ChatEmptyState
            onSelectPrompt={(p) => setEmptyStateValue(p)}
            onUserMessage={onUserMessage}
            onAssistantContent={onAssistantContent}
            onStreamDone={onStreamDone}
            onStreamError={onStreamError}
            onCreated={(newId) => {
              // Replace (not push) so the back button doesn't trap the
              // user on a stale /chats URL. The empty-state composer
              // already waits for the stream to finish before calling
              // this (see `useChatNewComposer`), so by the time we
              // navigate the user has a fully-formed conversation
              // visible on /chats/{id}.
              router.replace(`/chats/${newId}`);
            }}
            defaultWorkflowId={defaultWorkflowId}
            composerValue={emptyStateValue}
            onComposerValueChange={setEmptyStateValue}
            isStreaming={emptyStateStream.isStreaming}
            streamingContent={emptyStateStream.content}
            onStreamStatusChange={setEmptyStateStream}
          />
        </main>
        {pickerEl}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)] bg-[var(--paper)]">
      {sidebarEl(conversationId)}
      <div className="flex min-w-0 flex-1 flex-col">
        {conversation && (
          <ChatHeader
            conversation={conversation}
            workflowName={workflowName}
            workflows={workflows}
            streamStatus={stream.status}
            onRename={async (t) => {
              await sidebar.rename(conversationId, t);
              setConversation((c) => (c ? { ...c, title: t } : c));
            }}
            onDelete={async () => {
              await sidebar.remove(conversationId);
              router.push("/chats");
            }}
            onSetWorkflow={handleSetWorkflow}
          />
        )}
        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
            <MessageList
              messages={messages}
              streamingId={streamingMessageId}
              wide={sidebarCollapsed}
            />
            {conversation && (
              <ChatComposer
                conversationId={conversationId}
                stream={stream}
                onUserMessage={onUserMessage}
                onAssistantContent={onAssistantContent}
                onStreamDone={onStreamDone}
                onStreamError={onStreamError}
                wide={sidebarCollapsed}
              />
            )}
          </main>
          {stepsOpen && (
            <AgentStepsPanel
              steps={stream.steps}
              open={stepsOpen}
              onClose={() => setStepsOpen(false)}
            />
          )}
        </div>
        {!stepsOpen && stream.steps.length > 0 && (
          <button
            type="button"
            onClick={() => setStepsOpen(true)}
            className="absolute bottom-24 right-6 hidden items-center gap-1.5 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)] shadow-[2px_2px_0_0_var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] md:flex"
            aria-label="View agent steps"
          >
            <FiCpu className="h-3 w-3" />
            Steps
          </button>
        )}
      </div>
      {pickerEl}
    </div>
  );
}