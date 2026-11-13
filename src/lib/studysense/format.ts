// Timezone-independent formatting so server and browser render identically.
export const clock = (iso: string) => iso.slice(11, 16);
export const dateTime = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 19)} (UTC${iso.slice(19) || "Z"})`;
export const fmt = (v: number | null | undefined, unit: string, digits = 1) =>
  v == null ? null : `${v.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
