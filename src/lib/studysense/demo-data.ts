// DEMO MODE ONLY. Synthetic records, isolated here so they can never mix with real
// readings. Every screen that uses them shows a visible "Demo Mode" label.
import type { DataSource, StudySenseRecord } from "./types";

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

function buildDemoRecords(): StudySenseRecord[] {
  const rand = seeded(42);
  const out: StudySenseRecord[] = [];
  const count = 48; // 4 hours at 5-minute intervals
  for (let i = 0; i < count; i++) {
    const minutes = 18 * 60 + i * 5;
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    const p = i / (count - 1);
    const noisy = i > 38;
    const noise = noisy ? -30 + rand() * 4 : -47 + rand() * 8;
    out.push({
      device_id: "studysense-pi5-01",
      timestamp: `2026-11-12T${hh}:${mm}:00-06:00`,
      temperature_c: round(22.8 + p * 3.6 + (rand() - 0.5) * 0.4),
      humidity_pct: round(47 - p * 5 + (rand() - 0.5) * 1.2),
      pressure_hpa: null,
      light_lux: Math.round(430 - p * 250 + (rand() - 0.5) * 30),
      presence_detected: i < 8 ? false : rand() > 0.12,
      face_detected: rand() > 0.6,
      recognized_user: null,
      noise_dbfs: round(noise),
      sensor_health: {
        temperature: "ok",
        humidity: "ok",
        pressure: "no_data",
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

export function getDemoSource(): DataSource {
  return { mode: "demo", path: DB_PATH, records: buildDemoRecords() };
}
