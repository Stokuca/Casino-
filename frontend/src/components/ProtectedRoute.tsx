// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthed = useAppSelector(s => s.auth.isAuthed);

  if (isAuthed === null) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading…</div>;
  }
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
