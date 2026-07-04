"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import ChatShell from "@/components/chat/ChatShell";

/**
 * /chats — landing page.
 *
 * - If the URL has `?resume=<id>`, navigate straight to /chats/<id>.
 * - Otherwise, render the empty state (a sidebar of past chats plus
 *   the "Start a new chat" hero). The actual new-chat creation is
 *   handled inside `ChatShell` when the user picks a prompt.
 */
export default function ChatsLandingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const resume = params.get("resume");

  useEffect(() => {
    if (resume) {
      router.replace(`/chats/${resume}`);
    }
  }, [resume, router]);

  return <ChatShell conversationId={null} />;
}
