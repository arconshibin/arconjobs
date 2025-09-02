// src/services/clientService.ts
import { api, ApiOk, ApiErr, safe } from "../lib/api";

export type ClientStatus = "active" | "suspended" | "archived";

export interface Client {
  id: string; // UUID
  type: "client";
  name: string;
  country_code?: string | null;
  country_name?: string | null;
  address?: string | null;
  tax_id?: string | null;
  phone?: string | null;
  status: ClientStatus;
  added_by?: number | null; // user id
  created_at: string;
  updated_at: string;

  // present on create if you also created a contact login
  contact_user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  temp_password?: string; // only when backend generated one
}

// -------------------- GET CLIENTS --------------------
export async function getClients(params?: {
  q?: string;
  country_code?: string;
  status?: ClientStatus;
  ordering?: string;
}): Promise<ApiOk<Client[]> | ApiErr> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("search", params.q);
  if (params?.country_code) qs.set("country_code", params.country_code);
  if (params?.status) qs.set("status", params.status);
  if (params?.ordering) qs.set("ordering", params.ordering);
  const url = `/accounts/clients/${qs.toString() ? `?${qs.toString()}` : ""}`;
  return safe<Client[]>(api.get(url));
}

// -------------------- GET SINGLE CLIENT --------------------
export async function getClient(id: string): Promise<ApiOk<Client> | ApiErr> {
  return safe<Client>(api.get(`/accounts/clients/${id}/`));
}

// -------------------- CREATE CLIENT --------------------
export type CreateClientPayload = {
  name: string;
  country_code?: string;
  country_name?: string;
  address?: string;
  tax_id?: string;
  phone?: string;
  status?: ClientStatus; // default "active" on backend
  contact_person?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
    password?: string; // optional; backend will generate temp if omitted
  };
};

export async function createClient(
  payload: CreateClientPayload
): Promise<ApiOk<Client> | ApiErr> {
  return safe<Client>(api.post("/accounts/clients/", payload));
}

// -------------------- UPDATE CLIENT --------------------
export async function updateClient(
  id: string,
  payload: Partial<Omit<CreateClientPayload, "contact_person">>
): Promise<ApiOk<Client> | ApiErr> {
  // Send PATCH request with only fields to update
  const updateRes = await safe<Client>(api.patch(`/accounts/clients/${id}/`, payload));

  // If PATCH fails, return the error
  if ("error" in updateRes) return updateRes;

  // Re-fetch full client to ensure all fields are present (including country details)
  return getClient(id);
}

// -------------------- DELETE CLIENT --------------------
export async function deleteClient(id: string): Promise<ApiOk<{}> | ApiErr> {
  return safe<{}>(api.delete(`/accounts/clients/${id}/`));
}

// -------------------- RESET CONTACT PASSWORD --------------------
export async function resetContactPassword(
  id: string,
  payload?: { password?: string }
): Promise<ApiOk<{ contact_user: Client["contact_user"]; temp_password: string }> | ApiErr> {
  return safe(api.post(`/accounts/clients/${id}/reset-contact-password/`, payload ?? {}));
}
