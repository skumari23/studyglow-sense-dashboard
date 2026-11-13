import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StudySenseRecord } from "@/lib/studysense/types";
import { clock } from "@/lib/studysense/format";

export function HistoryChart({
  records,
  field,
  unit,
  color,
  threshold,
}: {
  records: StudySenseRecord[];
  field: keyof StudySenseRecord;
  unit: string;
  color: string;
  threshold?: { value: number; label: string };
}) {
  const data = records.map((r) => ({ t: clock(r.timestamp), v: r[field] as number | null }));
  const hasData = data.some((d) => d.v != null);
  if (!hasData)
    return (
      <div className="grid h-64 place-items-center text-sm text-muted-foreground">
        No recorded values for this sensor.
      </div>
    );
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
            formatter={(v: number) => [`${v} ${unit}`, ""]}
          />
          {threshold && (
            <ReferenceLine
              y={threshold.value}
              stroke="var(--warning)"
              strokeDasharray="4 4"
              label={{ value: threshold.label, fill: "var(--warning)", fontSize: 10, position: "insideTopRight" }}
            />
          )}
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
