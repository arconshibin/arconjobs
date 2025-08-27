// src/lib/auth.ts
const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api").replace(/\/$/, "");
const TOKEN_PATH   = import.meta.env.VITE_API_TOKEN_PATH   ?? "/auth/token/";
const REFRESH_PATH = import.meta.env.VITE_API_REFRESH_PATH ?? "/auth/refresh/";
const LOGOUT_PATH  = import.meta.env.VITE_API_LOGOUT_PATH  ?? "/auth/logout/";

let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}
export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}${TOKEN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // gets the refresh cookie set by the server
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  const data = await res.json(); // { access: "..." }
  setAccessToken(data.access ?? null);
  return data;
}

export async function tryRefresh() {
  const res = await fetch(`${API_BASE}${REFRESH_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",    // send the refresh cookie
    body: JSON.stringify({}),  // server reads cookie if body empty
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = await res.json(); // { access: "..." }
  setAccessToken(data.access ?? null);
  return data;
}

export async function logout() {
  await fetch(`${API_BASE}${LOGOUT_PATH}`, {
    method: "POST",
    credentials: "include",
  });
  setAccessToken(null);
}
