/**
 * Global axios instance for the frontend.
 *
 * `baseURL` is the FastAPI origin (e.g. `http://localhost:8000/api`) — every
 * request helper passes a path like `/workflows` and the instance prefixes
 * it. We deliberately do NOT use a Next.js rewrite to FastAPI; the
 * client talks to the backend directly so CORS, auth headers, and error
 * shapes are visible in DevTools.
 *
 * Configured once:
 *  - `withCredentials: false` — JWT lives in `localStorage`, not cookies.
 *  - `Content-Type: application/json` default. Overridden for FormData.
 *  - Request interceptor attaches `Authorization: Bearer <token>` if a
 *    token is in localStorage.
 *  - Response interceptor: 401 → clear token + redirect to `/signin`,
 *    matching the previous `authFetch` behavior. Network errors are
 *    passed through so call sites can decide what to do.
 *
 * SSR safety: `localStorage` access is guarded. During the server pass
 * we return an unauthenticated instance; client-side code always
 * re-runs and gets the real one.
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const FALLBACK_BASE = "http://localhost:8000/api";

function resolveBaseURL(): string {
    // `NEXT_PUBLIC_*` is inlined at build time by Next.js, so this branch
    // is the only one that runs in the browser too.
    const fromEnv = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
    return fromEnv && fromEnv.length > 0 ? fromEnv : FALLBACK_BASE;
}

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token");
}

function clearTokenAndRedirect(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("token");
    const next = window.location.pathname + window.location.search;
    const target =
        next && next !== "/signin" && next !== "/signup"
            ? `/signin?next=${encodeURIComponent(next)}`
            : "/signin";
    window.location.replace(target);
}

export const api: AxiosInstance = axios.create({
    baseURL: resolveBaseURL(),
    headers: { "Content-Type": "application/json" },
    timeout: 60_000_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
        config.headers = config.headers ?? ({} as any);
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Network / CORS / timeout — pass through unchanged. Callers can
        // branch on `error.code` / `error.message`.
        if (!error.response) {
            return Promise.reject(error);
        }
        if (error.response.status === 401) {
            clearTokenAndRedirect();
        }
        return Promise.reject(error);
    },
);

export default api;
