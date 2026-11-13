// Known StudySense devices, one per room. The selected device is kept in the URL (?device=)
// so every page reads the same room's records.
export interface StudySenseDevice {
  id: string; // matches device_id in studysense_db.json
  room: string;
}

export const DEVICES: StudySenseDevice[] = [
  { id: "studysense-pi5-01", room: "Study Room A" },
  { id: "studysense-pi5-02", room: "Library Quiet Zone" },
  { id: "studysense-pi5-03", room: "Dorm Room 214" },
];

export const DEFAULT_DEVICE_ID = "studysense-pi5-01";

export function resolveDevice(id: string | undefined | null): StudySenseDevice {
  return DEVICES.find((d) => d.id === id) ?? DEVICES.find((d) => d.id === DEFAULT_DEVICE_ID)!;
}
