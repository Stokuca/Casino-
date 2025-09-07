// src/store/slices/authSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Role, User } from "../../types/auth";

// Global auth state (cookie/session, bez tokena u JS)
export interface AuthState {
  /** null = ne znamo još (SessionProvider radi bootstrap); true/false = poznato */
  isAuthed: boolean | null;
  role: Role | null;
  user: User | null;
}

const initialState: AuthState = {
  isAuthed: null,
  role: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Postavi session nakon uspešnog /auth/login|register (+ /auth/me) */
    setSession: (state, action: PayloadAction<{ role: Role; user: User }>) => {
      state.isAuthed = true;
      state.role = action.payload.role;
      state.user = action.payload.user;
    },
    /** Session bootstrap je promašio (npr. nema cookie-ja) */
    clearSession: (state) => {
      state.isAuthed = false;
      state.role = null;
      state.user = null;
    },
    /** Logout (posle uspešnog /auth/logout ili kad refresh ne uspe) */
    logout: (state) => {
      state.isAuthed = false;
      state.role = null;
      state.user = null;
    },
  },
});

export const { setSession, clearSession, logout } = authSlice.actions;
export default authSlice.reducer;

/* --- Selektori (opciono) --- */
export const selectAuth = (s: { auth: AuthState }) => s.auth;
export const selectIsAuthed = (s: { auth: AuthState }) => s.auth.isAuthed;
export const selectRole = (s: { auth: AuthState }) => s.auth.role;
export const selectUser = (s: { auth: AuthState }) => s.auth.user;
