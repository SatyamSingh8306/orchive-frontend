# Orkaive Frontend

Next.js 16 (App Router) app for the **Orkaive** multi-agent platform:
visual workflow builder (`/agent-maker`), chat surface (`/chats`),
dashboard, marketing pages, and conflict UI.

## Quick start

```bash
npm install
cp .env.example .env.local       # if it exists
npm run dev                       # http://localhost:3000
```

Build & verify:

```bash
npm run lint      # ESLint — chat files must stay clean
npm run build     # next build with Turbopack
```

## Required env

Set `NEXT_PUBLIC_FASTAPI_BASE_URL` (default `http://localhost:8000`).
All `/api/*` browser traffic goes directly to FastAPI — there is no
Next.js rewrite.

```env
NEXT_PUBLIC_FASTAPI_BASE_URL=http://localhost:8000
```

## Architecture

- **Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · axios ·
  react-markdown · `react-icons/fi`
- **Path alias:** `@/*` → repo root
- **Two route groups:**
  - `app/` — public marketing + auth pages
  - `app/(app)/` — authed app wrapped in `ProtectedRoute` → `AppShell`

## Where to start

| If you want to… | Read this |
|---|---|
| Work on the chat UI | `agent.md` — components, hooks, the strict `MessageList` lint rule, composer modes |
| Add a new page | `app/(app)/chats/` is the canonical authed-page example |
| Build a new chat component | `components/chat/` — `ChatShell`, `MessageList`, `ChatComposer`, `WorkflowPickerDialog` |
| Touch HTTP calls | Use `api` from `lib/axios.ts` — never `fetch` directly, never add a Next.js proxy |
| Touch auth | `contexts/AuthContext.tsx` + `lib/axios.ts` (interceptor) |

## Documentation

- `agent.md` — focused guide for working in this app (start here)
- `../CLAUDE.md` — repo-wide context
- `../FEATURES.md` — feature overview

## See also

- `../orchive_agent_backend/agent.md` — the FastAPI backend this app talks to
- `../orchive_agent_backend/docs/README_AUTH.md` — auth endpoint reference
