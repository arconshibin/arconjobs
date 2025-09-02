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
  country_name?: string | null;
  vacancies_initial?: number | null;   // original announced openings
  vacancies_limit?: number | null;     // current cap
  vacancies_filled: number;            // system counter
  vacancies_remaining?: number | null; // computed by backend (read-only)
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

import { api, apiFetch } from "../lib/api";
// Note: `api` and `apiFetch` handle attaching the Bearer header and will
// attempt a single refresh using the centralized `tryRefresh()` helper.
// This file uses those helpers rather than maintaining its own cookie-based
// refresh logic to avoid mismatched refresh strategies.

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

export async function listJobs(
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<ServiceResult<Job[]>> {
  try {
    const usp = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === "") continue;
        usp.append(k, String(v));
      }
    }

    const path = `/jobs/${usp.toString() ? `?${usp.toString()}` : ""}`;
    const data = await api.get<Job[] | { results: Job[] }>(path);

    // 👇 Debug log to inspect API response
    console.log("Raw jobs API response:", data);

    const rows = Array.isArray(data) ? data : (data as any).results ?? [];
    return { success: true, returnedData: rows };
  } catch (e: any) {
    console.error("Error fetching jobs:", e); // 👈 optional, also useful
    return { success: false, error: e?.message ?? "Request failed" };
  }
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
  vacancies_initial?: number; // set on create; locked after
  vacancies_limit?: number;   // editable later
}

export async function createJob(payload: UpsertJobPayload): Promise<ServiceResult<Job>> {
  try {
    const form = toFormData(payload);
    const data = await api.postForm<Job>("/jobs/", form);  // << multipart via wrapper
    return { success: true, returnedData: data };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Request failed" };
  }
}

export async function updateJob(id: string, payload: UpsertJobPayload): Promise<ServiceResult<Job>> {
  try {
    const form = toFormData(payload);
    const data = await api.patchForm<Job>(`/jobs/${id}/`, form); // << multipart via wrapper
    return { success: true, returnedData: data };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Request failed" };
  }
}

export async function deleteJob(id: string): Promise<ServiceResult<{}>> {
  try {
    const res = await apiFetch(`/jobs/${id}/`, { method: "DELETE" });
    if (!res.ok) return { success: false, error: await res.json().catch(() => res.statusText), status: res.status };
    return { success: true, returnedData: {}, status: res.status };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Request failed" };
  }
}


