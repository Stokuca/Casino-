import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";  

import { logout } from "../store/slices/authSlice";
import { store } from "../store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true, // ⬅️ ključno za cookie-based auth
});

// (Opcioni fallback za projekat gde token nije u cookie-ju)
// api.interceptors.request.use((cfg) => {
//   const t = localStorage.getItem("token");
//   if (t) (cfg.headers ??= {}).Authorization = `Bearer ${t}`;
//   return cfg;
// });

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // ako nije 401 → prosledi grešku
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // već smo probali refresh za ovaj request
    if (original._retry) {
      store.dispatch(logout());
      return Promise.reject(error);
    }
    original._retry = true;

    // queue + refresh lock
    if (isRefreshing) {
      await new Promise<void>((resolve) => pendingQueue.push(resolve));
    } else {
      isRefreshing = true;
      try {
        await api.post("/auth/refresh"); // cookie-based refresh
        pendingQueue.forEach((fn) => fn());
        pendingQueue = [];
      } catch (e) {
        pendingQueue = [];
        store.dispatch(logout());
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // retry original
    return api(original);
  }
);

export { api };
