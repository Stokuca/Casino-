import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { logout } from "../store/slices/authSlice";
import { logoutApi } from "../api/auth";

export default function AppLayout() {
  const role = useAppSelector(s => s.auth.role);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const onLogout = async () => {
    try { await logoutApi(); } catch {}
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div className="font-semibold">Casino Platform</div>
        <nav className="flex gap-4">
          {role === "player" && (
            <>
              <NavLink to="/player" className="text-sm">Dashboard</NavLink>
              <NavLink to="/player/transactions" className="text-sm">Transactions</NavLink>
            </>
          )}
          {role === "operator" && (
            <>
              <NavLink to="/operator" className="text-sm">Dashboard</NavLink>
              <NavLink to="/operator/players" className="text-sm">Players</NavLink>
            </>
          )}
        </nav>
        <button onClick={onLogout} className="text-sm px-3 py-1 rounded bg-gray-900 text-white">Logout</button>
      </header>
      <main className="p-6"><Outlet /></main>
    </div>
  );
}
