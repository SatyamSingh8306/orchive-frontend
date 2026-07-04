/**
 * Back-compat shim around the global axios instance (`lib/axios.ts`).
 *
 * Existing call sites pass a path like `/api/workflows/123` and a
 * `RequestInit`-shaped options object. We translate that into an axios
 * call and then convert the axios response back into a `Response` so
 * the old `.json()` / `.status` access pattern keeps working.
 *
 * If you are writing new code, prefer `import { api } from '@/lib/axios'`
 * and use `api.get(...)` / `api.post(...)` directly — it gives you
 * proper TypeScript types and avoids the `Response` adapter layer.
 */
import { api } from "./axios";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

function methodOf(options: RequestInit | undefined, fallback: Method = "GET"): Method {
    const m = (options?.method ?? fallback).toString().toUpperCase();
    if (
        m === "GET" ||
        m === "POST" ||
        m === "PUT" ||
        m === "PATCH" ||
        m === "DELETE" ||
        m === "HEAD" ||
        m === "OPTIONS"
    ) {
        return m;
    }
    return fallback;
}

function readBody(options: RequestInit | undefined): unknown {
    const b = options?.body;
    if (!b) return undefined;
    if (typeof b === "string") {
        // Try to parse JSON; if it isn't JSON, pass the string through.
        try {
            return JSON.parse(b);
        } catch {
            return b;
        }
    }
    if (b instanceof FormData) return b;
    if (b instanceof URLSearchParams) return b;
    if (b instanceof Blob) return b;
    if (typeof b === "object") return b;
    return undefined;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // SSR / build safety: no window means no token, no redirect. Return
    // a synthetic 401 so the caller's await chain completes cleanly.
    if (typeof window === "undefined") {
        return new Response(JSON.stringify({ detail: "Unauthenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const method = methodOf(options);
    const data = readBody(options);

    // The baseURL on the axios instance already includes the `/api`
    // prefix (e.g. `http://localhost:8000/api`). Old call sites pass
    // paths like `/api/workflows/123`; strip the redundant `/api` so we
    // don't end up with `/api/api/workflows/123`.
    const cleanUrl = url.startsWith("/api/") ? url.slice(4) : url.startsWith("/api") ? url.slice(4) : url;

    try {
        const res = await api.request({
            url: cleanUrl,
            method,
            data,
            // If the caller sent FormData / Blob we let axios set the
            // Content-Type itself.
            headers:
                data instanceof FormData || data instanceof Blob
                    ? {}
                    : { "Content-Type": "application/json" },
        });
        return new Response(JSON.stringify(res.data), {
            status: res.status,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        // axios interceptor has already redirected on 401; for other
        // failures, build a Response that mirrors what `authFetch` used
        // to return.
        if (err?.response) {
            return new Response(JSON.stringify(err.response.data ?? { detail: "Error" }), {
                status: err.response.status,
                headers: { "Content-Type": "application/json" },
            });
        }
        // Network / timeout.
        return new Response(JSON.stringify({ detail: "Network error" }), {
            status: 0,
            headers: { "Content-Type": "application/json" },
        });
    }
}
