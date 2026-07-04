"use client";

import { use } from "react";
import ChatShell from "@/components/chat/ChatShell";

/**
 * /chats/[conversationId] — the chat screen for a single conversation.
 *
 * Next.js 16 hands dynamic params in via `use()` (params is a Promise
 * under the new async-params model). We unwrap it here and forward
 * the id to `ChatShell`.
 */
export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  return <ChatShell conversationId={conversationId} />;
}
