import { api } from "./http";
import type { Role, User } from "../types/auth";

export async function me(): Promise<{ role: Role; user: User }> {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function login(body: { email: string; password: string; }): Promise<{ role: Role; user: User }> {
  const { data } = await api.post("/auth/login", body);
  return data; // cookie setuje server
}

export async function register(body: { email: string; password: string; }): Promise<{ role: Role; user: User }> {
  const { data } = await api.post("/auth/register", body);
  return data;
}

export async function logoutApi(): Promise<void> {
  await api.post("/auth/logout");
}
