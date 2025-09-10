import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Role, User, Session } from "../../types/auth";

export interface AuthState {
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
    setSession: (state, action: PayloadAction<Session>) => {
      state.isAuthed = true;
      state.role = action.payload.role;
      state.user = action.payload.user;
    },
    clearSession: (state) => {
      state.isAuthed = false;
      state.role = null;
      state.user = null;
    },
    logout: (state) => {
      state.isAuthed = false;
      state.role = null;
      state.user = null;
    },
  },
});

export const { setSession, clearSession, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectAuth = (s: { auth: AuthState }) => s.auth;
export const selectIsAuthed = (s: { auth: AuthState }) => s.auth.isAuthed;
export const selectRole = (s: { auth: AuthState }) => s.auth.role;
export const selectUser = (s: { auth: AuthState }) => s.auth.user;
