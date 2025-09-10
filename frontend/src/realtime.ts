import { io, Socket } from "socket.io-client";

const httpBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const wsBase =
  (import.meta.env.VITE_WS_URL as string) ||
  httpBase.replace(/^http(s?):\/\//, "ws$1://") + "/ws"; 

export const socket: Socket = io(wsBase, {
  withCredentials: true,                  
  transports: ["websocket", "polling"],   
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,          
  reconnectionDelay: 500,                 
  reconnectionDelayMax: 5000,
  timeout: 10000,                        
});

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
  cb(status);
  return () => listeners.delete(cb);
};

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

socket.on("connect", () => {
  setStatus("connected");
});

socket.on("disconnect", (reason) => {
  setStatus("disconnected");
});

socket.io.on("reconnect_attempt", (attempt) => {
  setStatus("reconnecting");
});

socket.io.on("reconnect", (n) => {
  setStatus("connected");
});

socket.io.on("reconnect_error", (err) => {
  setStatus("error");
});

socket.io.on("reconnect_failed", () => {
  setStatus("error");
});

socket.on("connect_error", (err) => {
  setStatus("error");
});

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
