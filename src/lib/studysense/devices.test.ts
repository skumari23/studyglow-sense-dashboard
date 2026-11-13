import { describe, expect, it } from "vitest";
import { DEFAULT_DEVICE_ID, DEVICES, resolveDevice } from "./devices";
import { getDemoSource } from "./demo-data";

describe("device switching", () => {
  it("offers studysense-pi5-01 as a device option", () => {
    expect(DEVICES.map((d) => d.id)).toContain("studysense-pi5-01");
  });
  it("defaults to studysense-pi5-01 when no or an unknown device is chosen", () => {
    expect(DEFAULT_DEVICE_ID).toBe("studysense-pi5-01");
    expect(resolveDevice(undefined).id).toBe("studysense-pi5-01");
    expect(resolveDevice("not-a-device").id).toBe("studysense-pi5-01");
  });
  it("only returns records from the selected device", () => {
    const { records } = getDemoSource("studysense-pi5-02");
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((r) => r.device_id === "studysense-pi5-02")).toBe(true);
  });
});
