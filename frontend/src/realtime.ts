// src/realtime.ts
import { io, Socket } from "socket.io-client";

/* ---------- URL config ---------- */
const httpBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const wsBase =
  (import.meta.env.VITE_WS_URL as string) ||
  httpBase.replace(/^http(s?):\/\//, "ws$1://") + "/ws"; // namespace je /ws

/* ---------- Socket instance ---------- */
export const socket: Socket = io(wsBase, {
  withCredentials: true,                   // šalje httpOnly cookies u handshake-u
  transports: ["websocket", "polling"],    // fallback ako WS nije dostupan
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,          // pokušava beskonačno (možeš npr. 10)
  reconnectionDelay: 500,                  // 0.5s -> 5s backoff
  reconnectionDelayMax: 5000,
  timeout: 10000,                          // connect timeout
});

/* ---------- Connection status pub/sub ---------- */
export type ConnStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

let status: ConnStatus = "connecting";
const listeners = new Set<(s: ConnStatus) => void>();

const setStatus = (s: ConnStatus) => {
  if (status !== s) {
    status = s;
    for (const cb of listeners) cb(status);
  }
};

export const getConnectionStatus = () => status;
export const onConnectionStatus = (cb: (s: ConnStatus) => void) => {
  listeners.add(cb);
  // odmah javi trenutno stanje
  cb(status);
  return () => listeners.delete(cb);
};

// korisno kada želiš da “sačekaš” spajanje pre nego što se osloniš na WS
export const waitUntilConnected = () =>
  new Promise<void>((resolve) => {
    if (status === "connected") return resolve();
    const off = onConnectionStatus((s) => {
      if (s === "connected") {
        off();
        resolve();
      }
    });
  });

/* ---------- Low-level socket lifecycle logika ---------- */
socket.on("connect", () => {
  console.log("[WS] connected:", socket.id);
  setStatus("connected");
});

socket.on("disconnect", (reason) => {
  console.warn("[WS] disconnected:", reason);
  // socket.io sam prelazi u reconnect režim (ako je uključen)
  setStatus("disconnected");
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log("[WS] reconnect attempt:", attempt);
  setStatus("reconnecting");
});

socket.io.on("reconnect", (n) => {
  console.log("[WS] reconnected after", n, "tries");
  setStatus("connected");
});

socket.io.on("reconnect_error", (err) => {
  console.error("[WS] reconnect error:", err?.message || err);
  setStatus("error");
});

socket.io.on("reconnect_failed", () => {
  console.error("[WS] reconnect failed – giving up");
  setStatus("error");
});

socket.on("connect_error", (err) => {
  console.error("[WS] connect error:", err?.message || err);
  setStatus("error");
});

/* ---------- App-level helpers (event API) ---------- */
export const onMetricsChanged = (cb: (p: any) => void) => {
  const h = (p: any) => cb(p);
  socket.on("metrics:changed", h);
  return () => socket.off("metrics:changed", h);
};

export const onRevenueTick = (cb: (p: any) => void) => {
  const h = (p: any) => cb(p);
  socket.on("revenue:tick", h);
  return () => socket.off("revenue:tick", h);
};

export const onPlayerBalance = (cb: (cents: number) => void) => {
  const h = (p: any) => cb(Number(p?.balanceCents ?? 0));
  socket.on("balance:update", h);
  return () => socket.off("balance:update", h);
};

export const onPlayerTx = (cb: (tx: any) => void) => {
  const h = (tx: any) => cb(tx);
  socket.on("transaction:new", h);
  return () => socket.off("transaction:new", h);
};
