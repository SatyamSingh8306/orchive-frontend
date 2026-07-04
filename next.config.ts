import type { NextConfig } from "next";

/**
 * No /api/* proxy — the frontend talks to FastAPI directly through the
 * global axios instance in `lib/axios.ts` (baseURL from
 * `NEXT_PUBLIC_FASTAPI_BASE_URL`).
 *
 * If you ever need a single-file dev proxy for one-off debugging, prefer
 * doing it from the client with the axios `baseURL` override rather than
 * reintroducing rewrites here — keeping the proxy out of Next.js means
 * CORS, auth headers, and error shapes stay visible in DevTools.
 *
 * The `/workflow-chat` and `/agents-chat` routes were retired when the
 * new ChatGPT/Claude-style `/chats` surface landed. We 301 them to the
 * matching new URL so bookmarks, emails, and external links keep working.
 */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/workflow-chat", destination: "/chats", permanent: true },
      // /workflow-chat/{id} → /chats?resume={id} keeps the conversation
      // id as a query param; the /chats page reads it and navigates to
      // /chats/{id} once mounted.
      {
        source: "/workflow-chat/:id",
        destination: "/chats?resume=:id",
        permanent: true,
      },
      { source: "/agents-chat", destination: "/chats", permanent: true },
    ];
  },
};

export default nextConfig;
