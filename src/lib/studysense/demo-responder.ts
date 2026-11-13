// DEMO MODE ONLY. Rule-based stand-in used when the LangGraph agent is unavailable.
// It only reads existing records and never triggers sensors or non-allow-listed actions.
import { evaluateReading, type Preferences } from "./thresholds";
import type { StudySenseRecord } from "./types";

export function demoReply(question: string, r: StudySenseRecord, prefs: Preferences): string {
  const q = question.toLowerCase();
  const na = (v: unknown, s: string) => (v == null ? "unavailable in the latest record" : s);

  if (/(photo|picture|image|face|who|name|identity|camera)/.test(q))
    return "I can't share face images or identities. I can only tell you whether the latest record has a face detected, which it " +
      (r.face_detected == null ? "doesn't report." : r.face_detected ? "does." : "doesn't.");
  if (/(how many|count|people|free|spot|seat|occupied|empty)/.test(q))
    return `The mmWave sensor reports presence ${na(r.presence_detected, r.presence_detected ? "detected" : "not detected")}. That's presence only — it can't count people or confirm that a spot is free.`;
  if (/(temp|warm|hot|cold|cool)/.test(q))
    return `Temperature is ${na(r.temperature_c, `${r.temperature_c} °C`)}. Your preferred range is ${prefs.tempMinC}–${prefs.tempMaxC} °C.` +
      (r.temperature_c != null && r.temperature_c > prefs.tempMaxC ? " Consider moving somewhere cooler." : "") +
      (r.temperature_c != null && r.temperature_c < prefs.tempMinC ? " Consider moving somewhere warmer." : "");
  if (/(light|bright|dark|dim|lux)/.test(q))
    return `Light is ${na(r.light_lux, `${r.light_lux} lux`)} against your minimum of ${prefs.minLux} lux.` +
      (r.light_lux != null && r.light_lux < prefs.minLux ? " Moving somewhere brighter would help." : "");
  if (/(noise|loud|quiet|sound)/.test(q))
    return `Noise is ${na(r.noise_dbfs, `${r.noise_dbfs} dBFS`)} (relative level, not calibrated dB SPL); your tolerance is ${prefs.noiseToleranceDbfs} dBFS.` +
      (r.edge_impulse ? ` Edge Impulse classified it as ${r.edge_impulse.label}.` : "") +
      (r.noise_dbfs != null && r.noise_dbfs > prefs.noiseToleranceDbfs ? " A quieter spot is recommended." : "");
  if (/(unlock|delete|email|turn on|turn off|record|run|execute)/.test(q))
    return "That action isn't on the allow-list, so I can't do it. Allowed actions are: log an alert, show a dashboard banner, and publish to local MQTT.";

  const alerts = evaluateReading(r, prefs).filter((a) => a.recommendation);
  return alerts.length
    ? `Right now: ${alerts.map((a) => `${a.title.toLowerCase()} — ${a.recommendation}`).join(" ")}`
    : "All the latest readings are within your preferences. It looks like a comfortable spot to study.";
}
