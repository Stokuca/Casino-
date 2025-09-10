import { type Granularity } from "../../api/operator";

export default function Filters({
  from, to, gran, setFrom, setTo, setGran, onReset,
}: {
  from: string; to: string; gran: Granularity;
  setFrom: (v: string) => void; setTo: (v: string) => void;
  setGran: (g: Granularity) => void; onReset: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <select className="border rounded-lg p-2" value={gran} onChange={(e) => setGran(e.target.value as Granularity)}>
        <option value="day">Daily</option>
        <option value="week">Weekly</option>
        <option value="month">Monthly</option>
      </select>
      <input type="date" className="border rounded-lg p-2" value={from} onChange={(e) => setFrom(e.target.value)} />
      <input type="date" className="border rounded-lg p-2" value={to} onChange={(e) => setTo(e.target.value)} />
      <button className="border rounded-lg p-2 hover:bg-gray-50" onClick={onReset}>Reset</button>
    </div>
  );
}
