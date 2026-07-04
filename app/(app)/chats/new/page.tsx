"use client";

import ChatShell from "@/components/chat/ChatShell";

/**
 * /chats/new — same as the landing page. Provided as a separate route
 * so deep links (e.g. from the sidebar "new chat" button) land in the
 * right place.
 */
export default function NewChatPage() {
  return <ChatShell conversationId={null} />;
}
