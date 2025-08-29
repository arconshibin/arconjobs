import { setAccessToken } from "./api";

// src/lib/auth.ts
const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api").replace(/\/$/, "");
const TOKEN_PATH   = import.meta.env.VITE_API_TOKEN_PATH   ?? "/auth/token/";
const REFRESH_PATH = import.meta.env.VITE_API_REFRESH_PATH ?? "/auth/refresh/";
const LOGOUT_PATH  = import.meta.env.VITE_API_LOGOUT_PATH  ?? "/auth/logout/";


export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}${TOKEN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  const data = await res.json(); // { access: "..." }
  setAccessToken(data.access ?? null);
  // Persist refresh token client-side (stateless JWT flow)
  if (data.refresh) {
    try { localStorage.setItem("refresh_token", data.refresh); } catch(_) {}
  }
  return data;
}

export async function tryRefresh() {
  // Read refresh token from localStorage and send in body
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) {
    setAccessToken(null);
    return null;
  }
  const res = await fetch(`${API_BASE}${REFRESH_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = await res.json(); // { access: "..." }
  setAccessToken(data.access ?? null);
  // If server rotated refresh, persist the new refresh as well
  if (data.refresh) {
    try { localStorage.setItem("refresh_token", data.refresh); } catch(_) {}
  }
  return data;
}

export async function logout() {
  // Send refresh in body (stateless flow) so backend can blacklist it.
  const refresh = localStorage.getItem("refresh_token");
  await fetch(`${API_BASE}${LOGOUT_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(refresh ? { refresh } : {}),
  });
  try { localStorage.removeItem("refresh_token"); } catch(_) {}
  setAccessToken(null);
}
