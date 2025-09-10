import { useEffect, useState } from "react";

export function useAbortable<T>(fn: (signal: AbortSignal) => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true); setErr(null);
    fn(ctrl.signal)
      .then((d) => setData(d))
      .catch((e: any) => {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED" || e?.name === "AbortError") return;
        setErr(e?.response?.data?.message ?? e.message ?? "Failed");
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, err };
}
