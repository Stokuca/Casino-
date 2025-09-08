import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Role, User, Session } from "../../types/auth";

export interface AuthState {
  /** null = bootstrap u toku; true/false = poznato */
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
    /** Postavi session nakon /auth/login|register ili /operator/login */
    setSession: (state, action: PayloadAction<Session>) => {
      state.isAuthed = true;
      state.role = action.payload.role;
      state.user = action.payload.user;
    },
    /** Bootstrap nije uspeo (nema cookie-ja i sl.) */
    clearSession: (state) => {
      state.isAuthed = false;
      state.role = null;
      state.user = null;
    },
    /** Logout (i kada refresh padne) */
    logout: (state) => {
      state.isAuthed = false;
      state.role = null;
      state.user = null;
    },
  },
});

export const { setSession, clearSession, logout } = authSlice.actions;
export default authSlice.reducer;

/* --- Selektori --- */
export const selectAuth = (s: { auth: AuthState }) => s.auth;
export const selectIsAuthed = (s: { auth: AuthState }) => s.auth.isAuthed;
export const selectRole = (s: { auth: AuthState }) => s.auth.role;
export const selectUser = (s: { auth: AuthState }) => s.auth.user;
