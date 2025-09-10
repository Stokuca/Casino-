import { api } from "./http";

export type Balance = { balanceCents: number };

const usdToCentsStr = (x: number | string) =>
  String(Math.max(0, Math.floor((Number(x) || 0) * 100)));

export async function getBalance(signal?: AbortSignal): Promise<Balance> {
  try {
    const { data } = await api.get<{ balanceCents?: string | number }>("/me/balance", { signal });
    return { balanceCents: Number(data?.balanceCents ?? 0) };
  } catch (e: any) {
    if (e?.response?.status === 404) {
      const { data } = await api.get<{ balanceCents?: string | number }>("/wallet/balance", { signal });
      return { balanceCents: Number(data?.balanceCents ?? 0) };
    }
    throw e;
  }
}

export async function deposit(amountUsd: number | string, signal?: AbortSignal) {
  const body = { amountCents: usdToCentsStr(amountUsd) }; 
  const { data } = await api.post("/wallet/deposit", body, { signal });
  return { balanceCents: Number(data?.balanceCents ?? 0) };
}

export async function withdraw(amountUsd: number | string, signal?: AbortSignal) {
  const body = { amountCents: usdToCentsStr(amountUsd) };  
  const { data } = await api.post("/wallet/withdraw", body, { signal });
  return { balanceCents: Number(data?.balanceCents ?? 0) };
}
