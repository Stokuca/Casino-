// src/components/AppLayout.tsx
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { logout } from "../store/slices/authSlice";
import { logoutApi } from "../api/auth";

type NavItem = { to: string; label: string; end?: boolean };
const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

export default function AppLayout() {
  const { role, isAuthed } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = useCallback(async () => {
    try { setLoggingOut(true); await logoutApi(); } catch {}
    dispatch(logout());
    setLoggingOut(false);
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  if (isAuthed === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="flex items-center justify-between px-6 h-14 bg-white border-b">
          <div className="font-semibold">Casino Platform</div>
          <div className="text-sm text-gray-500">Loading…</div>
        </header>
        <main className="p-6" />
      </div>
    );
  }
  if (!isAuthed) return <Navigate to="/login" replace />;

  const navItems: NavItem[] = useMemo(() => {
    if (role === "player") {
      return [
        { to: "/player", label: "Dashboard", end: true },        // ✅ vraceno
        { to: "/player/transactions", label: "Transactions" },
      ];
    }
    if (role === "operator") {
      return [
        { to: "/operator/dashboard", label: "Dashboard", end: true },
        { to: "/operator/players", label: "Players" },
      ];
    }
    return [];
  }, [role]);

  const homeHref = role === "operator" ? "/operator/dashboard" : "/player"; // ✅ player home = /player

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 h-14 bg-white border-b">
        <div
          className="font-semibold cursor-pointer select-none"
          onClick={() => navigate(homeHref)}
          aria-label="Go to home"
        >
          Casino Platform
        </div>

        <nav className="flex gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                cx(
                  "text-sm transition-colors",
                  isActive ? "text-gray-900 font-medium" : "text-gray-600 hover:text-gray-900"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={onLogout}
          disabled={loggingOut}
          className={cx("text-sm px-3 py-1 rounded bg-gray-900 text-white", loggingOut && "opacity-60")}
        >
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
