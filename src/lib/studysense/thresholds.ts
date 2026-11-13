import type { StudySenseRecord } from "./types";

// Only these actions may ever run in response to an alert. Anything else is refused.
export const ALLOWED_ACTIONS = ["log_alert", "show_banner", "publish_local_mqtt"] as const;
export type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

export const ACTION_LABELS: Record<AllowedAction, string> = {
  log_alert: "Write to local alert log",
  show_banner: "Show banner on Dashboard",
  publish_local_mqtt: "Publish to local MQTT topic",
};

export interface Preferences {
  tempMinC: number;
  tempMaxC: number;
  minLux: number;
  noiseToleranceDbfs: number; // alert when louder (closer to 0) than this
  occupancyNotifications: boolean;
  enabledActions: AllowedAction[];
}

export const DEFAULT_PREFERENCES: Preferences = {
  tempMinC: 20,
  tempMaxC: 25,
  minLux: 300,
  noiseToleranceDbfs: -35,
  occupancyNotifications: true,
  enabledActions: ["log_alert", "show_banner"],
};

export type AlertKind =
  | "temp_high"
  | "temp_low"
  | "light_low"
  | "noise_high"
  | "presence"
  | "unavailable";

export interface StudyAlert {
  id: string;
  kind: AlertKind;
  severity: "warning" | "info";
  title: string;
  detail: string;
  recommendation: string | null;
  readingTimestamp: string;
}

export function isAllowedAction(action: string): action is AllowedAction {
  return (ALLOWED_ACTIONS as readonly string[]).includes(action);
}

export function actionsFor(prefs: Preferences, requested: string[] = prefs.enabledActions) {
  const allowed = requested.filter(isAllowedAction);
  const refused = requested.filter((a) => !isAllowedAction(a));
  return { allowed, refused };
}

export function evaluateReading(r: StudySenseRecord, prefs: Preferences): StudyAlert[] {
  const alerts: StudyAlert[] = [];
  const mk = (a: Omit<StudyAlert, "id" | "readingTimestamp">): StudyAlert => ({
    ...a,
    id: `${r.device_id}:${r.timestamp}:${a.kind}:${a.title}`,
    readingTimestamp: r.timestamp,
  });
  const missing: string[] = [];

  if (r.temperature_c == null) missing.push("temperature");
  else if (r.temperature_c > prefs.tempMaxC)
    alerts.push(
      mk({
        kind: "temp_high",
        severity: "warning",
        title: "Too warm",
        detail: `${r.temperature_c} °C is above your maximum of ${prefs.tempMaxC} °C.`,
        recommendation: "Move to cooler surroundings.",
      }),
    );
  else if (r.temperature_c < prefs.tempMinC)
    alerts.push(
      mk({
        kind: "temp_low",
        severity: "warning",
        title: "Too cold",
        detail: `${r.temperature_c} °C is below your minimum of ${prefs.tempMinC} °C.`,
        recommendation: "Move to warmer surroundings.",
      }),
    );

  if (r.light_lux == null) missing.push("light");
  else if (r.light_lux < prefs.minLux)
    alerts.push(
      mk({
        kind: "light_low",
        severity: "warning",
        title: "Too dim",
        detail: `${r.light_lux} lux is below your minimum of ${prefs.minLux} lux.`,
        recommendation: "Move to brighter surroundings.",
      }),
    );

  if (r.noise_dbfs == null) missing.push("noise");
  else if (r.noise_dbfs > prefs.noiseToleranceDbfs)
    alerts.push(
      mk({
        kind: "noise_high",
        severity: "warning",
        title: "Too noisy",
        detail: `${r.noise_dbfs} dBFS is louder than your tolerance of ${prefs.noiseToleranceDbfs} dBFS (relative level, not calibrated dB SPL).`,
        recommendation: "Move to quieter surroundings.",
      }),
    );

  if (prefs.occupancyNotifications && r.presence_detected === true)
    alerts.push(
      mk({
        kind: "presence",
        severity: "info",
        title: "Presence detected",
        detail:
          "The mmWave sensor detected presence near the desk. This is presence only: it does not count people or confirm a spot is free or taken.",
        recommendation: null,
      }),
    );

  if (missing.length)
    alerts.push(
      mk({
        kind: "unavailable",
        severity: "info",
        title: "Some readings unavailable",
        detail: `No ${missing.join(", ")} value in the latest record, so those thresholds were not checked.`,
        recommendation: null,
      }),
    );

  return alerts;
}
