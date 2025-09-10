import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { fmtUSD } from "../../utils/currency";

export default function RevenueAreaChart({ data, gran }: { data: Array<{ ts: string; ggr: number }>; gran: string }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="mb-2 font-medium">Revenue by {gran}</div>
      <div className="h-64">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <XAxis dataKey="ts" />
            <YAxis domain={['dataMin', 'dataMax']} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v: number) => fmtUSD(v * 100)} />
            <Area type="monotone" dataKey="ggr" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
