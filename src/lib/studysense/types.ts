// Mirrors one record in the TinyDB file on the Pi (studysense_db.json).
export type SensorHealthState = "ok" | "degraded" | "error" | "no_data";
export type SensorName = "temperature" | "humidity" | "pressure" | "light" | "mmwave" | "camera" | "microphone";
export type SensorHealth = Partial<Record<SensorName, SensorHealthState>>;

export interface StudySenseRecord {
  device_id: string;
  timestamp: string; // ISO 8601 with offset
  temperature_c: number | null;
  humidity_pct: number | null;
  pressure_hpa: number | null;
  light_lux: number | null;
  presence_detected: boolean | null; // mmWave presence only, never a people count
  face_detected: boolean | null;
  recognized_user: string | null; // personal data: never rendered
  noise_dbfs: number | null; // dBFS, not calibrated dB SPL
  sensor_health: SensorHealth;
  cloud_synced: boolean | null; // AWS IoT publish acknowledged only
  local_mqtt_published: boolean | null;
  // Optional Edge Impulse classifier output, present only when the model ran.
  edge_impulse?: { label: "Quiet" | "Noisy"; confidence: number } | null;
}

export interface DataSource {
  mode: "live" | "demo";
  path: string;
  records: StudySenseRecord[];
}
