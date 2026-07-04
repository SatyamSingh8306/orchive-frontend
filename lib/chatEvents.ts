/**
 * Chat event types — the union of events the client receives over SSE
 * (chat streaming) and the per-user WebSocket (sidebar live updates).
 *
 * Kept as a single union so consumers can `switch (e.type)` once and
 * have the discriminator narrow the rest of the shape.
 */

import type { ChatMessage, Conversation } from "@/types/chat";

/* ---- SSE (chat streaming) ------------------------------------------- */

export interface StreamReadyEvent {
  type: "ready";
  runId: string;
  workflowId: string;
  workflowName: string;
  /** Only present when the stream created a new conversation
   *  (`POST /api/chats/stream`). The client uses it to update the URL. */
  conversationId?: string;
}

export interface StreamStepEvent {
  type: "step";
  name: string;
  status: "started" | "completed";
}

export interface StreamTokenEvent {
  type: "token";
  delta: string;
  agent: string;
}

export interface StreamToolEvent {
  type: "tool";
  name: string;
  status: "started" | "completed";
}

export interface StreamMessageEvent {
  type: "message";
  agent: string;
  content: string;
  runId: string;
}

export interface StreamConflictEvent {
  type: "conflict";
  queryId: string;
  nodeLabel: string;
  query: string;
}

export interface StreamDoneEvent {
  type: "done";
  runId: string;
  content: string;
  durationMs: number;
  agentsUsed: string[];
  agentResults: Record<string, { response: string; status: string }>;
  messageId?: string;
}

export interface StreamErrorEvent {
  type: "error";
  runId?: string;
  message: string;
}

export interface StreamStoppedEvent {
  type: "stopped";
  runId?: string;
  content: string;
}

export type StreamEvent =
  | StreamReadyEvent
  | StreamStepEvent
  | StreamTokenEvent
  | StreamToolEvent
  | StreamMessageEvent
  | StreamConflictEvent
  | StreamDoneEvent
  | StreamErrorEvent
  | StreamStoppedEvent;

/* ---- WebSocket (sidebar live updates) -------------------------------- */

export interface WSConnectedEvent {
  type: "connected";
  channel: string;
}

export interface WSConversationNew {
  type: "conversation:new";
  conversation: Conversation;
}

export interface WSConversationUpdated {
  type: "conversation:updated";
  conversation: Conversation;
}

export interface WSConversationDeleted {
  type: "conversation:deleted";
  conversationId: string;
}

export interface WSMessageNew {
  type: "message:new";
  conversationId: string;
  message: ChatMessage;
}

export interface WSMessageUpdated {
  type: "message:updated";
  conversationId: string;
  message: ChatMessage;
}

export type ChatWSEvent =
  | WSConnectedEvent
  | WSConversationNew
  | WSConversationUpdated
  | WSConversationDeleted
  | WSMessageNew
  | WSMessageUpdated;
