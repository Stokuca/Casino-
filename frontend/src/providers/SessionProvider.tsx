import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { clearSession, setSession } from "../store/slices/authSlice";
import { me } from "../api/auth";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isAuthed = useAppSelector(s => s.auth.isAuthed);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await me();
        if (mounted) dispatch(setSession(data));
      } catch {
        if (mounted) dispatch(clearSession());
      }
    })();
    return () => { mounted = false; };
  }, [dispatch]);

  // dok ne znamo da li je ulogovan, prikaži kratki splash
  if (isAuthed === null) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading session…</div>;
  }
  return <>{children}</>;
}
