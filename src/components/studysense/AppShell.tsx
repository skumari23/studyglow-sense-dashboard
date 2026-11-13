import { Link } from "@tanstack/react-router";
import { Activity, BellRing, Bot, FlaskConical, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { DB_PATH } from "@/lib/studysense/demo-data";
import teddyBear from "@/assets/teddy-bear.png";
import { DeviceSwitcher } from "./DeviceSwitcher";

const NAV = [
  { to: "/", label: "Dashboard", icon: Activity },
  { to: "/alerts", label: "Alerts & Preferences", icon: BellRing },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      <aside className="border-b border-sidebar-border bg-sidebar md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex h-full flex-col gap-6 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-md bg-secondary shadow-glow">
              <img src={teddyBear} alt="StudySense teddy bear" width={36} height={36} className="h-9 w-9 object-cover" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">StudySense</div>
              <div className="eyebrow">Raspberry Pi 5</div>
            </div>
          </div>
          <DeviceSwitcher />
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                search={true}
                activeOptions={{ exact: true }}
                className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto hidden space-y-3 md:block">
            <div className="rounded-md border border-demo/40 bg-demo/10 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-demo">
                <FlaskConical className="h-3.5 w-3.5" /> DEMO MODE
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Synthetic records. On the Pi, data is read from
              </p>
              <code className="readout mt-1 block break-all text-[11px] text-foreground">{DB_PATH}</code>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              No face images, identities or keys are shown here.
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0">
        <div className="flex items-center gap-2 border-b border-demo/30 bg-demo/10 px-6 py-2 text-xs text-demo md:hidden">
          <FlaskConical className="h-3.5 w-3.5" /> Demo Mode · synthetic readings
        </div>
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-demo/40 bg-demo/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-demo">
      <FlaskConical className="h-3 w-3" /> Demo Mode
    </span>
  );
}

type Tone = "ok" | "warn" | "bad" | "off" | "info";
const TONE: Record<Tone, string> = {
  ok: "bg-success",
  warn: "bg-warning",
  bad: "bg-destructive",
  off: "bg-muted-foreground",
  info: "bg-info",
};
export function StatusDot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${TONE[tone]} ${pulse ? "animate-pulse-dot" : ""}`} />;
}
export type { Tone };
