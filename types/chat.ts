/**
 * Chat domain types shared by the frontend.
 *
 * Field names mirror the backend Pydantic models
 * (app/schemas/conversation.py, app/schemas/message.py). Where the
 * backend uses camelCase aliases, the frontend reads the same string
 * — the backend serializes `lastMessageAt`, `userId`, etc.
 */

export type MessageRole = "user" | "assistant" | "system" | "tool";
export type MessageStatus = "streaming" | "complete" | "error" | "stopped";

/** Lifecycle of a chat run. `streaming` means the assistant is generating. */
export type StreamStatus =
  | "idle"
  | "sending"
  | "streaming"
  | "done"
  | "error"
  | "stopped";

export interface Conversation {
  _id: string;
  userId: string;
  workflowId: string | null;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  lastMessagePreview: string;
  deletedAt: string | null;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  status: MessageStatus;
  parentId?: string | null;
  runId?: string | null;
  agentResults?: Record<string, { response: string; status: string }>;
  durationMs?: number | null;
  metadata?: Record<string, unknown>;
}

/** A "step" record used by the optional agent steps panel. */
export interface AgentStep {
  agent: string;
  status: "started" | "completed" | "error";
  content?: string;
}

/** A workflow as the chat surfaces it (the picker dialog, the chat
 *  header rebind dropdown). The backend exposes workflows via
 *  `GET /api/workflows` with `id` and `name`. */
export interface WorkflowOption {
  id: string;
  name: string;
}
