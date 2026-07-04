"use client";

/**
 * ConversationList — sidebar list, grouped by date.
 *
 * Group order: Pinned → Today → Yesterday → Previous 7 days →
 * Previous 30 days → Older. Each group is a section with a small
 * mono-spaced eyebrow. Empty groups are hidden.
 *
 * Filtering: if `query` is non-empty, the entire list collapses to
 * a single "Results" group (server-side search results).
 */

import { useMemo } from "react";

import ConversationItem from "./ConversationItem";
import type { Conversation } from "@/types/chat";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onRename: (id: string, title: string) => Promise<void> | void;
  onPin: (id: string, pinned: boolean) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  query?: string;
}

interface Bucket {
  label: string;
  items: Conversation[];
}

function bucketFor(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const sevenDaysAgo = startOfToday - 7 * 86_400_000;
  const thirtyDaysAgo = startOfToday - 30 * 86_400_000;
  const t = d.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfYesterday) return "Yesterday";
  if (t >= sevenDaysAgo) return "Previous 7 days";
  if (t >= thirtyDaysAgo) return "Previous 30 days";
  return "Older";
}

function bucketConversations(
  list: Conversation[],
  options: { query?: string } = {},
): Bucket[] {
  if (options.query) {
    return [
      {
        label: `Results (${list.length})`,
        items: list,
      },
    ];
  }

  // Pinned bucket — shown first if there are any pinned items.
  const pinned = list.filter((c) => c.pinned);
  const unpinned = list.filter((c) => !c.pinned);

  // Sort the unpinned list by lastMessageAt desc (the backend already
  // sorts this way, but re-assert in case the order changed via WS).
  unpinned.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );

  const groups = new Map<string, Conversation[]>();
  for (const conv of unpinned) {
    const b = bucketFor(conv.lastMessageAt);
    if (!groups.has(b)) groups.set(b, []);
    groups.get(b)!.push(conv);
  }

  const orderedLabels = [
    "Today",
    "Yesterday",
    "Previous 7 days",
    "Previous 30 days",
    "Older",
  ];
  const buckets: Bucket[] = [];
  if (pinned.length > 0) {
    buckets.push({ label: "Pinned", items: pinned });
  }
  for (const label of orderedLabels) {
    const items = groups.get(label);
    if (items && items.length > 0) {
      buckets.push({ label, items });
    }
  }
  return buckets;
}

export default function ConversationList({
  conversations,
  activeId,
  onRename,
  onPin,
  onDelete,
  query,
}: ConversationListProps) {
  const buckets = useMemo(
    () => bucketConversations(conversations, { query }),
    [conversations, query],
  );

  if (buckets.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
          No chats yet
        </p>
        <p className="mt-2 text-[12px] text-[var(--ink-2)]">
          Start a new chat to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="flex flex-col">
          <div className="mono mb-1 px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
            {bucket.label}
          </div>
          <div className="flex flex-col">
            {bucket.items.map((c) => (
              <ConversationItem
                key={c._id}
                conversation={c}
                active={c._id === activeId}
                onRename={onRename}
                onPin={onPin}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
