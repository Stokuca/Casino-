import { api } from "./http";
import type { Session } from "../types/auth";

export async function me(signal?: AbortSignal): Promise<Session> {
  const { data } = await api.get("/auth/me", { signal });
  return data;
}

export async function loginPlayer(
  body: { email: string; password: string },
  signal?: AbortSignal
): Promise<Session> {
  const { data } = await api.post("/auth/login", body, { signal });
  return data;
}

export async function loginOperator(
  body: { email: string; password: string },
  signal?: AbortSignal
): Promise<Session> {
  const { data } = await api.post("/operator/login", body, { signal });
  return data;
}

export async function register(
  body: { email: string; password: string },
  signal?: AbortSignal
): Promise<Session> {
  const { data } = await api.post("/auth/register", body, { signal });
  return data;
}

export async function logoutApi(signal?: AbortSignal): Promise<void> {
  await api.post("/auth/logout", undefined, { signal });
}
