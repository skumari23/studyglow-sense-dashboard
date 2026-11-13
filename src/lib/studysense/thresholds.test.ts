import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, actionsFor, evaluateReading } from "./thresholds";
import type { StudySenseRecord } from "./types";

const base: StudySenseRecord = {
  device_id: "t",
  timestamp: "2026-11-12T20:00:00-06:00",
  temperature_c: 22,
  humidity_pct: 45,
  pressure_hpa: 1012,
  light_lux: 500,
  presence_detected: false,
  face_detected: false,
  recognized_user: null,
  noise_dbfs: -50,
  sensor_health: {},
  cloud_synced: true,
  local_mqtt_published: true,
};
const prefs = { ...DEFAULT_PREFERENCES, tempMinC: 20, tempMaxC: 25, minLux: 300, noiseToleranceDbfs: -35 };
const kinds = (r: Partial<StudySenseRecord>, p = prefs) =>
  evaluateReading({ ...base, ...r }, p).map((a) => a.kind);

describe("StudySense alert rules", () => {
  it("recommends cooler surroundings above max temperature", () => {
    const a = evaluateReading({ ...base, temperature_c: 25.5 }, prefs);
    expect(a.find((x) => x.kind === "temp_high")?.recommendation).toBe("Move to cooler surroundings.");
  });
  it("recommends warmer surroundings below min temperature", () => {
    expect(kinds({ temperature_c: 19.5 })).toContain("temp_low");
  });
  it("recommends brighter surroundings below minimum lux", () => {
    expect(kinds({ light_lux: 299 })).toContain("light_low");
    expect(kinds({ light_lux: 300 })).not.toContain("light_low");
  });
  it("flags noise louder than the dBFS tolerance", () => {
    expect(kinds({ noise_dbfs: -30 })).toContain("noise_high");
    expect(kinds({ noise_dbfs: -40 })).not.toContain("noise_high");
  });
  it("never invents values: missing readings skip thresholds and are reported", () => {
    const k = kinds({ temperature_c: null, light_lux: null, noise_dbfs: null });
    expect(k).toEqual(["unavailable"]);
  });
  it("presence alerts only when occupancy notifications are on", () => {
    expect(kinds({ presence_detected: true })).toContain("presence");
    expect(kinds({ presence_detected: true }, { ...prefs, occupancyNotifications: false })).not.toContain("presence");
  });
  it("refuses actions that are not allow-listed", () => {
    const r = actionsFor(prefs, ["log_alert", "unlock_door"]);
    expect(r.allowed).toEqual(["log_alert"]);
    expect(r.refused).toEqual(["unlock_door"]);
  });
});
