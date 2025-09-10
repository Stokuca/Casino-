import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { fmtUSD } from "../../utils/currency";

export default function RevenuePieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="mb-2 font-medium">Revenue by game</div>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label />
            {data.map((d, i) => <Cell key={`${d.name}-${i}`} />)}
            <Legend />
            <Tooltip formatter={(v: number) => fmtUSD(v * 100)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
