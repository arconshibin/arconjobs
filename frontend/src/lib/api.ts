// src/lib/api.ts
// Single source of truth for API calls + tokens

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || "http://localhost:8000/api";
const REFRESH_PATH = import.meta.env.VITE_API_REFRESH_PATH ?? "/auth/refresh/";
function url(path: string) {
  return path.startsWith("http") ? path : `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

// ---- access token management (single source of truth) ----
let accessToken: string | null =
  (typeof localStorage !== "undefined" && (localStorage.getItem("access_token") || null)) ||
  (typeof sessionStorage !== "undefined" && (sessionStorage.getItem("access_token") || null)) ||
  null;

export function setAccessToken(token: string | null, persist: "local" | "session" | "none" = "local") {
  accessToken = token;
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem("access_token");
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("access_token");
    if (token) {
      if (persist === "local" && typeof localStorage !== "undefined") localStorage.setItem("access_token", token);
      if (persist === "session" && typeof sessionStorage !== "undefined") sessionStorage.setItem("access_token", token);
    }
  } catch {}
}

export function clearAccessToken() {
  setAccessToken(null, "none");
}

// ---- refresh using the server-set refresh cookie ----
async function refreshAccess(): Promise<boolean> {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) {
      setAccessToken(null);
      return false;
    }
    const res = await fetch(`${API_BASE}${REFRESH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      setAccessToken(null);
      return false;
    }
    const data = await res.json(); // { access: "..." }
    setAccessToken(data.access ?? null);
    // If server rotated refresh, persist the new refresh as well
    if (data.refresh) {
      try { localStorage.setItem("refresh_token", data.refresh); } catch(_) {}
    }
    return data;
}

// 🔧 Back-compat export expected by AuthContext (returns boolean)
export async function initAccessFromRefresh(): Promise<boolean> {
  return refreshAccess();
}




// ---- core fetch with 401->refresh->replay ----
export async function apiFetch(path: string, init: RequestInit = {}) {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const method = (init.method || "GET").toUpperCase();

  const headers: Record<string, string> = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(init.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  // CSRF only for JSON non-GET if you need it; skip for FormData to avoid boundary issues
  const opts: RequestInit = {
    credentials: "include",
    ...init,
    method,
    headers,
  };

  let res = await fetch(url(path), opts);
  if (res.status !== 401) return res;

  // attempt exactly one refresh + replay
  const ok = await refreshAccess();
  if (!ok) return res;

  const replayHeaders: Record<string, string> = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(init.headers as Record<string, string> | undefined),
  };
  if (accessToken) replayHeaders["Authorization"] = `Bearer ${accessToken}`;

  res = await fetch(url(path), { ...opts, headers: replayHeaders });
  return res;
}

// ---- tiny JSON helper ----
async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.clone().json().catch(() => ({} as any));
  if (!res.ok) {
    // surface server error message if available
    const err = (data?.error ?? data?.detail ?? res.statusText) as any;
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }
  return (data?.returnedData ?? data) as T;
}

// ---- public API helpers ----
export const api = {
  async get<T>(path: string) {
    const res = await apiFetch(path, { method: "GET" });
    return parseJson<T>(res);
  },
  async post<T>(path: string, body?: any) {
    const res = await apiFetch(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
    return parseJson<T>(res);
  },
  async patch<T>(path: string, body?: any) {
    const res = await apiFetch(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
    return parseJson<T>(res);
  },
  async delete<T>(path: string) {
    const res = await apiFetch(path, { method: "DELETE" });
    return parseJson<T>(res);
  },
  // multipart helpers (for jobs with image_files)
  async postForm<T>(path: string, form: FormData) {
    const res = await apiFetch(path, { method: "POST", body: form });
    return parseJson<T>(res);
  },
  async patchForm<T>(path: string, form: FormData) {
    const res = await apiFetch(path, { method: "PATCH", body: form });
    return parseJson<T>(res);
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