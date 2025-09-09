// src/realtime.ts
import { io, Socket } from "socket.io-client";

const httpBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const wsBase =
  (import.meta.env.VITE_WS_URL as string) ||
  httpBase.replace(/^http(s?):\/\//, "ws$1://") + "/ws"; // namespace je /ws

export const socket: Socket = io(wsBase, {
  withCredentials: true,                 // da pošalje httpOnly cookie u handshake-u
  transports: ["websocket", "polling"],  // safe fallback
  autoConnect: true,
});

// Helperi koje pozivaš iz komponenti:
export function onMetricsChanged(cb: (p: any) => void) {
  const h = (p: any) => cb(p);
  socket.on("metrics:changed", h);
  return () => socket.off("metrics:changed", h);
}
export function onRevenueTick(cb: (p: any) => void) {
  const h = (p: any) => cb(p);
  socket.on("revenue:tick", h);
  return () => socket.off("revenue:tick", h);
}
export function onPlayerBalance(cb: (cents: number) => void) {
  const h = (p: any) => cb(Number(p?.balanceCents ?? 0));
  socket.on("balance:update", h);
  return () => socket.off("balance:update", h);
}
export function onPlayerTx(cb: (tx: any) => void) {
  const h = (tx: any) => cb(tx);
  socket.on("transaction:new", h);
  return () => socket.off("transaction:new", h);
}
