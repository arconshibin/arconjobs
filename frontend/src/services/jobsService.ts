// src/services/jobServices.ts
// Self-contained helper: no external fetch wrappers needed.

export type JobStatus = "active" | "inactive" | "deleted";

export interface JobImage {
  id: string;
  image: string;
  caption?: string;
  uploaded_at: string;
}

export interface Job {
  id: string;
  organization: string;
  title: string;
  description?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  country?: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  images?: JobImage[];
}

type Success<T> = { success: true; returnedData: T; status?: number };
type Failure = { success: false; error: any; status?: number };
export type ServiceResult<T> = Success<T> | Failure;

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost/api";

function getAccessToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("access") : null;
}
function setAccessToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem("access", token);
}

async function refreshAccessToken(): Promise<boolean> {
  // Cookie-based refresh: must send credentials so httpOnly refresh cookie is sent
  const r = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    credentials: "include",
  });
  if (!r.ok) return false;
  const data = await r.json().catch(() => ({}));
  const newAccess = data?.access;
  if (newAccess) {
    setAccessToken(newAccess);
    return true;
  }
  return false;
}

async function authFetch(input: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Don’t set Content-Type for FormData; fetch will do it
  const resp = await fetch(input, { ...init, headers });

  if (resp.status !== 401 || !retry) return resp;

  // Try to refresh and retry once
  const ok = await refreshAccessToken();
  if (!ok) return resp;

  const headers2 = new Headers(init.headers || {});
  const token2 = getAccessToken();
  if (token2) headers2.set("Authorization", `Bearer ${token2}`);

  return fetch(input, { ...init, headers: headers2 });
}

function toFormData(payload: Record<string, any>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (v == null) continue;
    if (k === "image_files" && Array.isArray(v)) {
      v.forEach((f: File) => fd.append("image_files", f));
    } else {
      fd.set(k, String(v));
    }
  }
  return fd;
}

// ------- Public API -------

export async function listJobs(): Promise<ServiceResult<Job[]>> {
  const r = await authFetch(`${API_BASE}/jobs/`, { method: "GET" });
  if (!r.ok) return { success: false, error: await r.json().catch(() => r.statusText), status: r.status };
  const data = await r.json();
  const results: Job[] = Array.isArray(data) ? data : data.results ?? [];
  return { success: true, returnedData: results, status: r.status };
}

export interface UpsertJobPayload {
  organization?: string;             // staff/admin: must provide; client users: backend forces their org
  title: string;
  description?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  country?: string | null;
  status?: "active" | "inactive";    // "deleted" not allowed here; only superadmin via DELETE
  image_files?: File[];
}

export async function createJob(payload: UpsertJobPayload): Promise<ServiceResult<Job>> {
  const r = await authFetch(`${API_BASE}/jobs/`, {
    method: "POST",
    body: toFormData(payload),
    // NOTE: do not set Content-Type for FormData
  });
  if (!r.ok) return { success: false, error: await r.json().catch(() => r.statusText), status: r.status };
  return { success: true, returnedData: await r.json(), status: r.status };
}

export async function updateJob(id: string, payload: UpsertJobPayload): Promise<ServiceResult<Job>> {
  const r = await authFetch(`${API_BASE}/jobs/${id}/`, {
    method: "PATCH",
    body: toFormData(payload),
  });
  if (!r.ok) return { success: false, error: await r.json().catch(() => r.statusText), status: r.status };
  return { success: true, returnedData: await r.json(), status: r.status };
}

export async function deleteJob(id: string): Promise<ServiceResult<{}>> {
  const r = await authFetch(`${API_BASE}/jobs/${id}/`, { method: "DELETE" });
  if (!r.ok) return { success: false, error: await r.json().catch(() => r.statusText), status: r.status };
  return { success: true, returnedData: {}, status: r.status };
}
