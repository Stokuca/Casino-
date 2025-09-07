import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store";
import type { Role } from "../types/auth";

export default function RoleRoute({ allow, children }: { allow: Role; children: React.ReactNode }) {
  const { role, isAuthed } = useAppSelector(s => s.auth);
  if (isAuthed === null) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (role !== allow) return <Navigate to={role === "operator" ? "/operator" : "/player"} replace />;
  return <>{children}</>;
}
