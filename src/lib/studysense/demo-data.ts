// DEMO MODE ONLY. Synthetic records, isolated here so they can never mix with real
// readings. Every screen that uses them shows a visible "Demo Mode" label.
import type { DataSource, StudySenseRecord } from "./types";
import { resolveDevice } from "./devices";

export const DB_PATH = "/home/shreyak/NOTE/studysense_db.json";

function seeded(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

// Each demo room gets its own character so switching devices visibly changes the readings.
interface RoomProfile {
  seed: number;
  tempStart: number;
  tempRise: number;
  humidity: number;
  luxStart: number;
  luxDrop: number;
  quietDbfs: number;
  noisyFrom: number; // record index where it gets loud; > count means never
  hasPressure: boolean;
}

const DEFAULT_PROFILE: RoomProfile = { seed: 42, tempStart: 22.8, tempRise: 3.6, humidity: 47, luxStart: 430, luxDrop: 250, quietDbfs: -47, noisyFrom: 39, hasPressure: false };

const PROFILES: Record<string, RoomProfile> = {
  "studysense-pi5-01": DEFAULT_PROFILE,
  "studysense-pi5-02": { seed: 7, tempStart: 21.2, tempRise: 0.8, humidity: 42, luxStart: 520, luxDrop: 60, quietDbfs: -55, noisyFrom: 999, hasPressure: true },
  "studysense-pi5-03": { seed: 99, tempStart: 24.1, tempRise: 1.4, humidity: 55, luxStart: 260, luxDrop: 120, quietDbfs: -42, noisyFrom: 20, hasPressure: true },
};

function buildDemoRecords(deviceId: string): StudySenseRecord[] {
  const pr = PROFILES[deviceId] ?? DEFAULT_PROFILE;
  const rand = seeded(pr.seed);
  const out: StudySenseRecord[] = [];
  const count = 48; // 4 hours at 5-minute intervals
  for (let i = 0; i < count; i++) {
    const minutes = 18 * 60 + i * 5;
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    const p = i / (count - 1);
    const noisy = i >= pr.noisyFrom;
    const noise = noisy ? -30 + rand() * 4 : pr.quietDbfs + rand() * 8;
    out.push({
      device_id: deviceId,
      timestamp: `2026-11-12T${hh}:${mm}:00-06:00`,
      temperature_c: round(pr.tempStart + p * pr.tempRise + (rand() - 0.5) * 0.4),
      humidity_pct: round(pr.humidity - p * 5 + (rand() - 0.5) * 1.2),
      pressure_hpa: pr.hasPressure ? round(1012.4 - p * 1.8 + (rand() - 0.5) * 0.6) : null,
      light_lux: Math.round(pr.luxStart - p * pr.luxDrop + (rand() - 0.5) * 30),
      presence_detected: i < 8 ? false : rand() > 0.12,
      face_detected: rand() > 0.6,
      recognized_user: null,
      noise_dbfs: round(noise),
      sensor_health: {
        temperature: "ok",
        humidity: "ok",
        pressure: pr.hasPressure ? "ok" : "no_data",
        light: "ok",
        mmwave: "ok",
        camera: "ok",
        microphone: i > 44 ? "degraded" : "ok",
      },
      cloud_synced: i === count - 2 ? false : rand() > 0.05,
      local_mqtt_published: true,
      edge_impulse:
        i % 3 === 0 ? { label: noisy ? "Noisy" : "Quiet", confidence: round(0.78 + rand() * 0.2, 2) } : null,
    });
  }
  return out;
}

export function getDemoSource(deviceId?: string): DataSource {
  const device = resolveDevice(deviceId);
  return { mode: "demo", path: DB_PATH, records: buildDemoRecords(device.id) };
}
