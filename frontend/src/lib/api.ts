// src/lib/api.ts

// ---- Base + paths (unchanged shape; tweak defaults for JWT) ----
const RAW_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";
const API_BASE = RAW_BASE.replace(/\/$/, ""); // strip trailing slash

// Allow overriding these if your backend paths differ:
const CSRF_PATH    = import.meta.env.VITE_API_CSRF_PATH    ?? "/csrf/";
const REFRESH_PATH = import.meta.env.VITE_API_REFRESH_PATH ?? "/auth/refresh/"; // <-- JWT refresh

function url(path: string) {
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ---- CSRF cookie helper (harmless if unused with JWT) ----
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function ensureCsrf() {
  // hit /csrf/ once to set csrftoken cookie (optional for JWT)
  await fetch(url(CSRF_PATH), { credentials: "include" });
}

// ---- NEW: minimal JWT token handling in-memory ----
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

/** Try to mint a fresh access token using the httpOnly refresh cookie. */
export async function initAccessFromRefresh(): Promise<boolean> {
  const r = await fetch(url(REFRESH_PATH), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}), // server reads refresh from cookie
  });
  if (!r.ok) return false;
  const data = await r.clone().json().catch(() => null);
  const token = data?.access ?? null;
  accessToken = token;
  return !!token;
}

// ---- Core fetch with Bearer + one refresh retry on 401 ----
export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  // Attach Bearer if we have it
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const opts: RequestInit = {
    credentials: "include", // keep cookies for refresh route
    headers,
    ...init,
  };

  // Optional CSRF for unsafe methods (harmless with JWT)
  const method = (opts.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const token = getCookie("csrftoken");
    if (token) headers["X-CSRFToken"] = token;
  }

  // First attempt
  let res = await fetch(url(path), opts);
  if (res.status !== 401) return res;

  // One retry: try to refresh access via cookie
  const refreshed = await initAccessFromRefresh();
  if (!refreshed) return res;

  // Update header and retry once
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  res = await fetch(url(path), { ...opts, headers });
  return res;
}

// ----- JSON helper + tiny API wrapper (unchanged external shape) -----

async function json<T>(res: Response): Promise<T> {
  const data = await res
    .clone()
    .json()
    .catch(() => ({} as any));
  if (!res.ok) {
    const err = (data && (data.error ?? data.detail)) || res.statusText;
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }
  // Supports both raw { ... } and wrapped { returnedData: ... }
  return (data?.returnedData ?? data) as T;
}

export const api = {
  async get<T>(path: string) {
    const res = await apiFetch(path, { method: "GET" });
    return json<T>(res);
  },
  async post<T>(path: string, body?: any) {
    const res = await apiFetch(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    return json<T>(res);
  },
  async patch<T>(path: string, body?: any) {
    const res = await apiFetch(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return json<T>(res);
  },
  async delete<T>(path: string) {
    const res = await apiFetch(path, { method: "DELETE" });
    return json<T>(res);
  },
};

// Optional: handy typed result wrappers if you prefer try/catch-free service code
export type ApiOk<T> = { success: true; returnedData: T };
export type ApiErr = { success: false; error: string };

export async function safe<T>(p: Promise<T>): Promise<ApiOk<T> | ApiErr> {
  try {
    const data = await p;
    return { success: true, returnedData: data };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Request failed" };
  }
}
