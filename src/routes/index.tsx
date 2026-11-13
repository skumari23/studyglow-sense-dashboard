import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AudioLines,
  Camera,
  CloudUpload,
  Droplets,
  Gauge,
  Radar,
  Radio,
  Sun,
  Thermometer,
  TriangleAlert,
} from "lucide-react";
import { useMemo } from "react";
import { NoRecords } from "@/components/studysense/NoRecords";
import type { StudySenseRecord } from "@/lib/studysense/types";
import { DemoBadge, PageHeader, StatusDot, type Tone } from "@/components/studysense/AppShell";
import { MetricCard } from "@/components/studysense/MetricCard";
import { HistoryChart } from "@/components/studysense/HistoryChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDemoSource } from "@/lib/studysense/demo-data";
import { clock, dateTime, fmt } from "@/lib/studysense/format";
import { usePreferences } from "@/lib/studysense/store";
import { evaluateReading } from "@/lib/studysense/thresholds";
import type { SensorHealthState, SensorName } from "@/lib/studysense/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · StudySense" },
      { name: "description", content: "Latest StudySense readings, history charts and sensor health." },
      { property: "og:title", content: "Dashboard · StudySense" },
      { property: "og:description", content: "Latest StudySense readings, history charts and sensor health." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: () => getDemoSource(),
  component: Dashboard,
});

const HEALTH_TONE: Record<SensorHealthState, Tone> = { ok: "ok", degraded: "warn", error: "bad", no_data: "off" };
const HEALTH_LABEL: Record<SensorHealthState, string> = {
  ok: "OK",
  degraded: "Degraded",
  error: "Error",
  no_data: "No data",
};

function Dashboard() {
  const { records } = Route.useLoaderData();
  const latest = records.at(-1);
  if (!latest) return <NoRecords />;
  return <DashboardView records={records} latest={latest} />;
}

function DashboardView({ records, latest }: { records: StudySenseRecord[]; latest: StudySenseRecord }) {
  const { prefs } = usePreferences();
  const warnings = useMemo(
    () => evaluateReading(latest, prefs).filter((a) => a.severity === "warning"),
    [latest, prefs],
  );
  const showBanner = prefs.enabledActions.includes("show_banner") && warnings.length > 0;
  const lastEi = [...records].reverse().find((r) => r.edge_impulse);
  const h = latest.sensor_health;
  const ts = clock(latest.timestamp);

  return (
    <>
      <PageHeader eyebrow={`Device ${latest.device_id}`} title="Dashboard">
        <div className="flex flex-col items-end gap-2">
          <DemoBadge />
          <div className="readout text-xs text-muted-foreground">Latest record {dateTime(latest.timestamp)}</div>
        </div>
      </PageHeader>

      {showBanner && (
        <Link
          to="/alerts"
          className="mb-6 flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm transition-colors hover:bg-warning/15"
        >
          <TriangleAlert className="h-4 w-4 shrink-0 text-warning" />
          <span className="font-medium text-warning">{warnings.length} active alert{warnings.length > 1 ? "s" : ""}:</span>
          <span className="truncate text-foreground">{warnings.map((w) => w.recommendation).join(" · ")}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">View →</span>
        </Link>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={Thermometer} label="Temperature" value={fmt(latest.temperature_c, "")} unit="°C" tone={HEALTH_TONE[h.temperature ?? "no_data"]} timestamp={ts} note={`Preferred ${prefs.tempMinC}–${prefs.tempMaxC} °C`} />
        <MetricCard icon={Droplets} label="Humidity" value={fmt(latest.humidity_pct, "")} unit="%" tone={HEALTH_TONE[h.humidity ?? "no_data"]} timestamp={ts} note="Relative humidity" />
        <MetricCard icon={Gauge} label="Pressure" value={fmt(latest.pressure_hpa, "")} unit="hPa" tone={HEALTH_TONE[h.pressure ?? "no_data"]} timestamp={ts} note="Barometric" />
        <MetricCard icon={Sun} label="Light" value={latest.light_lux == null ? null : String(latest.light_lux)} unit="lux" tone={HEALTH_TONE[h.light ?? "no_data"]} timestamp={ts} note={`Minimum ${prefs.minLux} lux`} />
        <MetricCard icon={AudioLines} label="Noise level" value={fmt(latest.noise_dbfs, "")} unit="dBFS" tone={HEALTH_TONE[h.microphone ?? "no_data"]} timestamp={ts} note="Relative level, not calibrated dB SPL" />
        <MetricCard
          icon={Radar}
          label="Presence (mmWave)"
          value={latest.presence_detected == null ? null : latest.presence_detected ? "Detected" : "None"}
          tone={HEALTH_TONE[h.mmwave ?? "no_data"]}
          timestamp={ts}
          note="Presence only, not a people count"
        />
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="panel flex items-center gap-4 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-secondary">
            <AudioLines className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Edge Impulse · sound class</div>
            {lastEi?.edge_impulse ? (
              <div className="mt-0.5 flex items-center gap-2 text-sm">
                <StatusDot tone={lastEi.edge_impulse.label === "Quiet" ? "ok" : "warn"} />
                <span className="font-semibold">{lastEi.edge_impulse.label}</span>
                <span className="readout text-muted-foreground">{Math.round(lastEi.edge_impulse.confidence * 100)}%</span>
                <span className="readout ml-auto text-xs text-muted-foreground">at {clock(lastEi.timestamp)}</span>
              </div>
            ) : (
              <div className="mt-0.5 text-sm text-muted-foreground">No classifier output in records</div>
            )}
          </div>
        </div>
        <div className="panel flex items-center gap-4 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-secondary">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Camera</div>
            <div className="mt-0.5 flex items-center gap-2 text-sm">
              <StatusDot tone={HEALTH_TONE[h.camera ?? "no_data"]} />
              <span className="font-semibold">
                {latest.face_detected == null ? "Unavailable" : latest.face_detected ? "Face detected" : "No face"}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">Identity & images hidden</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="eyebrow">History</div>
            <h2 className="text-lg font-semibold">Last {records.length} records</h2>
          </div>
        </div>
        <Tabs defaultValue="temperature">
          <TabsList>
            <TabsTrigger value="temperature">Temperature</TabsTrigger>
            <TabsTrigger value="humidity">Humidity</TabsTrigger>
            <TabsTrigger value="light">Light</TabsTrigger>
            <TabsTrigger value="noise">Noise</TabsTrigger>
            <TabsTrigger value="pressure">Pressure</TabsTrigger>
          </TabsList>
          <TabsContent value="temperature" className="mt-4">
            <HistoryChart records={records} field="temperature_c" unit="°C" color="var(--chart-1)" threshold={{ value: prefs.tempMaxC, label: `max ${prefs.tempMaxC} °C` }} />
          </TabsContent>
          <TabsContent value="humidity" className="mt-4">
            <HistoryChart records={records} field="humidity_pct" unit="%" color="var(--chart-3)" />
          </TabsContent>
          <TabsContent value="light" className="mt-4">
            <HistoryChart records={records} field="light_lux" unit="lux" color="var(--chart-2)" threshold={{ value: prefs.minLux, label: `min ${prefs.minLux} lux` }} />
          </TabsContent>
          <TabsContent value="noise" className="mt-4">
            <HistoryChart records={records} field="noise_dbfs" unit="dBFS" color="var(--chart-4)" threshold={{ value: prefs.noiseToleranceDbfs, label: `tolerance ${prefs.noiseToleranceDbfs} dBFS` }} />
          </TabsContent>
          <TabsContent value="pressure" className="mt-4">
            <HistoryChart records={records} field="pressure_hpa" unit="hPa" color="var(--chart-5)" />
          </TabsContent>
        </Tabs>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-5">
          <div className="eyebrow">Sensor health</div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {(Object.keys(h) as SensorName[]).map((name) => {
              const state = h[name] ?? "no_data";
              return (
              <li key={name} className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-sm">
                <span>{name === "mmwave" ? "mmWave" : name.charAt(0).toUpperCase() + name.slice(1)}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusDot tone={HEALTH_TONE[state]} /> {HEALTH_LABEL[state]}
                </span>
              </li>
              );
            })}
          </ul>
        </div>
        <div className="panel p-5">
          <div className="eyebrow">Connections · latest record</div>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Radio className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Local MQTT</span>
                  <span className="flex items-center gap-2 text-xs">
                    <StatusDot tone={latest.local_mqtt_published ? "ok" : "bad"} />
                    {latest.local_mqtt_published ? "Published" : "Not published"}
                  </span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CloudUpload className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>AWS IoT publish</span>
                  <span className="flex items-center gap-2 text-xs">
                    <StatusDot tone={latest.cloud_synced ? "ok" : "warn"} />
                    {latest.cloud_synced ? "Acknowledged" : "Not acknowledged"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confirms the AWS IoT publish was acknowledged. DynamoDB delivery is not independently verified.
                </p>
              </div>
            </li>
            <li className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>Cloud-acknowledged records</span>
              <span className="readout text-foreground">
                {records.filter((r) => r.cloud_synced).length}/{records.length}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
