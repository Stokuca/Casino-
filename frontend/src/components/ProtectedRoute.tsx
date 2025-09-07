import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../store";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthed = useAppSelector(s => s.auth.isAuthed);
  const loc = useLocation();

  if (isAuthed === null) return null; // SessionProvider već prikazuje splash
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: loc }} />;

  return <>{children}</>;
}
