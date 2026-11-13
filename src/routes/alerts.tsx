import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Info, Lock, Save, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { NoRecords } from "@/components/studysense/NoRecords";
import type { StudySenseRecord } from "@/lib/studysense/types";
import { DemoBadge, PageHeader } from "@/components/studysense/AppShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getDemoSource } from "@/lib/studysense/demo-data";
import { clock, dateTime } from "@/lib/studysense/format";
import { useAlertLog, usePreferences } from "@/lib/studysense/store";
import {
  ACTION_LABELS,
  ALLOWED_ACTIONS,
  actionsFor,
  evaluateReading,
  type Preferences,
  type StudyAlert,
} from "@/lib/studysense/thresholds";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts & Preferences · StudySense" },
      { name: "description", content: "Set comfort thresholds and review StudySense alerts and recommendations." },
      { property: "og:title", content: "Alerts & Preferences · StudySense" },
      { property: "og:description", content: "Set comfort thresholds and review StudySense alerts and recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loaderDeps: ({ search }) => ({ device: search.device }),
  loader: ({ deps }) => getDemoSource(deps.device),
  component: AlertsPage,
});

function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  hint,
  step = 1,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="readout pr-14"
        />
        <span className="readout pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AlertRow({ alert, actions }: { alert: StudyAlert; actions?: string[] }) {
  const warn = alert.severity === "warning";
  const Icon = warn ? TriangleAlert : Info;
  return (
    <li className={`rounded-lg border p-4 ${warn ? "border-warning/40 bg-warning/5" : "border-info/30 bg-info/5"}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${warn ? "text-warning" : "text-info"}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{alert.title}</span>
            <span className="readout text-xs text-muted-foreground">{clock(alert.readingTimestamp)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
          {alert.recommendation && (
            <p className="mt-2 text-sm font-medium text-primary">→ {alert.recommendation}</p>
          )}
          {actions && actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {actions.map((a) => (
                <span key={a} className="readout rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function AlertsPage() {
  const { records } = Route.useLoaderData();
  const latest = records.at(-1);
  if (!latest) return <NoRecords />;
  return <AlertsPageView records={records} latest={latest} />;
}

function AlertsPageView({ records, latest }: { records: StudySenseRecord[]; latest: StudySenseRecord }) {
  const { prefs, save, loaded } = usePreferences();
  const { log, append, clear } = useAlertLog();
  const [draft, setDraft] = useState<Preferences>(prefs);
  useEffect(() => setDraft(prefs), [prefs]);

  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const valid =
    [draft.tempMinC, draft.tempMaxC, draft.minLux, draft.noiseToleranceDbfs].every(Number.isFinite) &&
    draft.tempMinC < draft.tempMaxC &&
    draft.noiseToleranceDbfs <= 0 &&
    draft.minLux >= 0;
  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs);

  const current = useMemo(() => evaluateReading(latest, prefs), [latest, prefs]);
  const { allowed } = actionsFor(prefs);

  useEffect(() => {
    if (!loaded || !allowed.includes("log_alert")) return;
    const now = new Date().toISOString();
    append(current.map((a) => ({ ...a, loggedAt: now, actions: allowed })));
  }, [loaded, current, allowed.join(","), append]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSave = () => {
    if (!valid) return;
    save(draft);
    toast.success("Preferences saved", { description: "Written to preferences.json (browser storage in this preview)." });
  };

  return (
    <>
      <PageHeader eyebrow="Thresholds & notifications" title="Alerts & Preferences">
        <DemoBadge />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="panel space-y-6 p-6">
          <div>
            <div className="eyebrow">Comfort preferences</div>
            <p className="mt-1 text-sm text-muted-foreground">Real readings are checked against these values.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberField id="tmin" label="Min temperature" unit="°C" step={0.5} value={draft.tempMinC} onChange={(n) => set("tempMinC", n)} />
            <NumberField id="tmax" label="Max temperature" unit="°C" step={0.5} value={draft.tempMaxC} onChange={(n) => set("tempMaxC", n)} />
          </div>
          <NumberField id="lux" label="Minimum light" unit="lux" step={10} value={draft.minLux} onChange={(n) => set("minLux", n)} />
          <NumberField
            id="noise"
            label="Noise tolerance"
            unit="dBFS"
            value={draft.noiseToleranceDbfs}
            onChange={(n) => set("noiseToleranceDbfs", n)}
            hint="dBFS is relative to the microphone's full scale (0 = loudest). It is not calibrated dB SPL."
          />

          <div className="flex items-start justify-between gap-4 rounded-lg bg-secondary/60 p-4">
            <div>
              <Label htmlFor="occ">Occupancy notifications</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Notify when the mmWave sensor detects presence. Presence only, never a people count or a confirmed free spot.
              </p>
            </div>
            <Switch id="occ" checked={draft.occupancyNotifications} onCheckedChange={(v) => set("occupancyNotifications", v)} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span className="eyebrow">Allow-listed alert actions</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Only these actions can run. Anything else is refused.</p>
            <ul className="mt-3 space-y-2">
              {ALLOWED_ACTIONS.map((a) => (
                <li key={a} className="flex items-center gap-3">
                  <Checkbox
                    id={`act-${a}`}
                    checked={draft.enabledActions.includes(a)}
                    onCheckedChange={(v) =>
                      set("enabledActions", v ? [...draft.enabledActions, a] : draft.enabledActions.filter((x) => x !== a))
                    }
                  />
                  <Label htmlFor={`act-${a}`} className="flex-1 font-normal">
                    {ACTION_LABELS[a]}
                  </Label>
                  <code className="readout text-[10px] text-muted-foreground">{a}</code>
                </li>
              ))}
            </ul>
          </div>

          {!valid && (
            <p className="text-sm text-destructive">
              Check values: min temperature must be below max, lux ≥ 0, and noise tolerance ≤ 0 dBFS.
            </p>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            <code className="readout text-xs text-muted-foreground">preferences.json</code>
            <Button onClick={onSave} disabled={!valid || !dirty}>
              <Save className="h-4 w-4" /> Save preferences
            </Button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="eyebrow">Latest reading</div>
                <h2 className="text-lg font-semibold">Current alerts</h2>
              </div>
              <span className="readout text-xs text-muted-foreground">{dateTime(latest.timestamp)}</span>
            </div>
            {current.length === 0 ? (
              <p className="mt-4 rounded-lg bg-success/10 p-4 text-sm text-success">All readings within your preferences.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {current.map((a) => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Alert log</h2>
                <span className="readout text-xs text-muted-foreground">({log.length})</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clear} disabled={!log.length}>
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
            {!prefs.enabledActions.includes("log_alert") && (
              <p className="mt-3 text-xs text-muted-foreground">Logging is off. Enable "Write to local alert log" to record alerts.</p>
            )}
            {log.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No alerts logged yet.</p>
            ) : (
              <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {log.map((a) => (
                  <AlertRow key={a.id} alert={a} actions={a.actions} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
