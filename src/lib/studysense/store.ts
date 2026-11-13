// Browser-preview stand-ins for the Pi's local JSON files (preferences.json, alerts_log.json).
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PREFERENCES, type Preferences, type StudyAlert } from "./thresholds";

const PREFS_KEY = "studysense.preferences";
const LOG_KEY = "studysense.alert_log";

export interface LoggedAlert extends StudyAlert {
  loggedAt: string;
  actions: string[];
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setPrefs({ ...DEFAULT_PREFERENCES, ...read(PREFS_KEY, {}) });
    setLoaded(true);
  }, []);
  const save = useCallback((next: Preferences) => {
    setPrefs(next);
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }, []);
  return { prefs, save, loaded };
}

export function useAlertLog() {
  const [log, setLog] = useState<LoggedAlert[]>([]);
  useEffect(() => setLog(read(LOG_KEY, [])), []);
  const append = useCallback((items: LoggedAlert[]) => {
    setLog((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      const next = [...items.filter((i) => !seen.has(i.id)), ...prev].slice(0, 200);
      window.localStorage.setItem(LOG_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const clear = useCallback(() => {
    window.localStorage.removeItem(LOG_KEY);
    setLog([]);
  }, []);
  return { log, append, clear };
}
