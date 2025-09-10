import { useState } from "react";

export default function WalletPanel({
  busy,
  onDeposit,
  onWithdraw,
}: {
  busy: boolean;
  onDeposit: (amountUsd: number) => void;
  onWithdraw: (amountUsd: number) => void;
}) {
  const [dep, setDep] = useState("100");
  const [wd, setWd] = useState("50");

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Deposit</h3>
        <p className="mb-4 text-sm text-gray-500">Add funds to your wallet.</p>
        <div className="flex items-center gap-3">
          <input type="number" min={1} step="1" value={dep} onChange={(e) => setDep(e.target.value)} className="w-40 rounded border px-3 py-2" />
          <button
            type="button"
            onClick={() => onDeposit(Number(dep))}
            disabled={busy}
            className="rounded-xl bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? "Processing…" : "Deposit"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Withdraw</h3>
        <p className="mb-4 text-sm text-gray-500">Withdraw winnings.</p>
        <div className="flex items-center gap-3">
          <input type="number" min={1} step="1" value={wd} onChange={(e) => setWd(e.target.value)} className="w-40 rounded border px-3 py-2" />
          <button
            type="button"
            onClick={() => onWithdraw(Number(wd))}
            disabled={busy}
            className="rounded-xl bg-white px-4 py-2 text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? "Processing…" : "Withdraw"}
          </button>
        </div>
      </div>
    </section>
  );
}
