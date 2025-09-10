import { fmtUSD } from "../../utils/currency";

type Row = { game: string; ggrCents?: string; bets?: number; rtpActual?: number; rtpTheoretical?: number };

export default function GamesTable({ title, rows, loading }: { title: string; rows: Row[]; loading: boolean }) {
  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="px-4 py-3 font-medium border-b">{title}</div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Game</th>
            <th className="px-3 py-2 text-right">GGR</th>
            <th className="px-3 py-2 text-right"># Bets</th>
            <th className="px-3 py-2 text-right">RTP (act/th)</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={4} className="px-3 py-6 text-center">Loading…</td></tr>}
          {!loading && rows.map((g, i) => (
            <tr key={`${g.game}-${i}`} className="border-t">
              <td className="px-3 py-2">{g.game}</td>
              <td className="px-3 py-2 text-right">{fmtUSD(g.ggrCents)}</td>
              <td className="px-3 py-2 text-right">{g.bets ?? "-"}</td>
              <td className="px-3 py-2 text-right">
                {g.rtpActual != null && g.rtpTheoretical != null
                  ? `${Number(g.rtpActual).toFixed(1)}% / ${Number(g.rtpTheoretical).toFixed(1)}%`
                  : "-"}
              </td>
            </tr>
          ))}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">No data.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
