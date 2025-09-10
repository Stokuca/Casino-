export default function KpiCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
    return (
      <div className="rounded-2xl border p-4 bg-white">
        <div className="text-gray-500 text-sm">{label}</div>
        <div className="text-xl font-semibold">{loading ? "…" : value}</div>
      </div>
    );
  }
  