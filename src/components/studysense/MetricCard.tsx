import type { LucideIcon } from "lucide-react";
import { StatusDot, type Tone } from "./AppShell";

export function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  note,
  tone = "ok",
  timestamp,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  unit?: string;
  note?: string;
  tone?: Tone;
  timestamp: string;
}) {
  const unavailable = value == null;
  return (
    <div className="panel flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" /> {label}
        </div>
        <StatusDot tone={unavailable ? "off" : tone} />
      </div>
      {unavailable ? (
        <div>
          <div className="readout text-2xl text-muted-foreground">—</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sensor unavailable
          </div>
        </div>
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="readout text-4xl font-medium">{value}</span>
          {unit && <span className="readout text-sm text-muted-foreground">{unit}</span>}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate">{note}</span>
        <span className="readout shrink-0">{timestamp}</span>
      </div>
    </div>
  );
}
