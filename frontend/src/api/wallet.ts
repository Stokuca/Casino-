import { api } from "./http";

export type Balance = { balanceCents: string };

export async function getBalance(): Promise<Balance> {
  const { data } = await api.get("/me/balance"); // ili /wallet/balance – uskladi sa backendom
  return data;
}
export async function deposit(amountCents: number) {
  const { data } = await api.post("/wallet/deposit", { amountCents });
  return data;
}
export async function withdraw(amountCents: number) {
  const { data } = await api.post("/wallet/withdraw", { amountCents });
  return data;
}
