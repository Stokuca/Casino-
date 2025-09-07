// src/api/wallet.ts
import { api } from "./http";

export type Balance = { balanceCents: string };

// Vrati trenutno stanje balansa
export async function getBalance(): Promise<Balance> {
  const { data } = await api.get<Balance>("/me/balance");
  return data;
}

// Deposit (dodaje sredstva)
// Backend očekuje { amountCents }
export async function deposit(body: { amountCents: string }) {
  const { data } = await api.post("/wallet/deposit", body);
  return data;
}
export async function withdraw(body: { amountCents: string }) {
  const { data } = await api.post("/wallet/withdraw", body);
  return data;
}

