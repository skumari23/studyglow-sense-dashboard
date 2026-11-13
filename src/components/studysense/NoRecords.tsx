import { Database } from "lucide-react";
import { DB_PATH } from "@/lib/studysense/demo-data";

export function NoRecords() {
  return (
    <div className="panel grid place-items-center gap-3 p-12 text-center">
      <Database className="h-6 w-6 text-muted-foreground" />
      <h2 className="text-lg font-semibold">No sensor records yet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Nothing to show until the logger writes records to <code className="readout text-foreground">{DB_PATH}</code>.
      </p>
    </div>
  );
}
