import { useNavigate, useSearch } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEVICES, resolveDevice } from "@/lib/studysense/devices";

export function DeviceSwitcher() {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const current = resolveDevice(search.device);

  return (
    <div className="space-y-1.5">
      <label htmlFor="device-switcher" className="eyebrow flex items-center gap-1.5">
        <MapPin className="h-3 w-3" /> Room
      </label>
      <Select
        value={current.id}
        onValueChange={(id) => navigate({ to: ".", search: (prev) => ({ ...prev, device: id }) })}
      >
        <SelectTrigger id="device-switcher" aria-label="Choose room" className="h-auto bg-background/60 py-2 text-left">
          <SelectValue>
            <span className="flex flex-col">
              <span className="text-sm font-medium">{current.room}</span>
              <span className="readout text-[11px] text-muted-foreground">{current.id}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DEVICES.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              <span className="flex flex-col">
                <span className="text-sm font-medium">{d.room}</span>
                <span className="readout text-[11px] text-muted-foreground">{d.id}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
