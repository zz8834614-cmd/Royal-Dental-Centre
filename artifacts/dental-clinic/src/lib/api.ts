import { getStoredToken } from "@/lib/auth";

export function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    ...(init?.headers ?? {}),
    ...(token ? { "x-user-id": token } : {}),
  };
  return fetch(url, { ...init, headers });
}
