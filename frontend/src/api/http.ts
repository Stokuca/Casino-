// src/api/http.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { store } from "../store";
import { logout } from "../store/slices/authSlice";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || !original) return Promise.reject(error);

    if (original._retry) {
      store.dispatch(logout());
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      await new Promise<void>((resolve) => queue.push(resolve));
    } else {
      isRefreshing = true;
      try {
        await api.post("/auth/refresh");
        queue.forEach((fn) => fn());
      } catch (e) {
        store.dispatch(logout());
        return Promise.reject(e);
      } finally {
        queue = [];
        isRefreshing = false;
      }
    }
    return api(original);
  }
);

// (privremeno) pomozi sebi:
console.log("API baseURL =", api.defaults.baseURL);
