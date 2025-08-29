// src/services/directoryService.ts
import { api, safe, ApiOk, ApiErr } from "../lib/api";

export type Country = {
  code: string;
  name: string;
  dial_code?: string | null;
};

async function fetchAllCountries(): Promise<Country[]> {
  const first = await api.get<Country[] | { results: Country[]; next?: string | null }>(
    "/directory/countries/"
  );

  // Non-paginated case
  if (Array.isArray(first)) return first;

  // Paginated: collect all pages
  let all: Country[] = first.results ?? [];
  let next = first.next ?? null;

  while (next) {
    // IMPORTANT: pass the absolute URL we got from DRF.
    // api.url() will detect "http" and NOT prefix VITE_API_BASE, avoiding /api/api/...
    const page = await api.get<Country[] | { results: Country[]; next?: string | null }>(next);
    if (Array.isArray(page)) {
      all = all.concat(page);
      next = null;
    } else {
      all = all.concat(page.results ?? []);
      next = page.next ?? null;
    }
  }
  return all;
}

export async function getCountries(): Promise<ApiOk<Country[]> | ApiErr> {
  return safe<Country[]>(fetchAllCountries());
}
