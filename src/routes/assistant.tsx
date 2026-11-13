import { createFileRoute } from "@tanstack/react-router";
import { Bot, FileCode2, Lock, RefreshCw, SendHorizontal, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { NoRecords } from "@/components/studysense/NoRecords";
import type { StudySenseRecord } from "@/lib/studysense/types";
import { DemoBadge, PageHeader, StatusDot } from "@/components/studysense/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDemoSource } from "@/lib/studysense/demo-data";
import { demoReply } from "@/lib/studysense/demo-responder";
import { usePreferences } from "@/lib/studysense/store";
import { ACTION_LABELS, ALLOWED_ACTIONS } from "@/lib/studysense/thresholds";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant · StudySense" },
      { name: "description", content: "Ask the StudySense assistant about your study space readings." },
      { property: "og:title", content: "AI Assistant · StudySense" },
      { property: "og:description", content: "Ask the StudySense assistant about your study space readings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loaderDeps: ({ search }) => ({ device: search.device }),
  loader: ({ deps }) => getDemoSource(deps.device),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; text: string; source?: "demo" | "agent" };

const SUGGESTIONS = [
  "Is this a good spot to study right now?",
  "Is it too noisy?",
  "Is the light bright enough?",
  "How many people are here?",
];

const AGENT_PATH = "~/NOTE/studysense_agent.py";

function AssistantPage() {
  const { records } = Route.useLoaderData();
  const latest = records.at(-1);
  if (!latest) return <NoRecords />;
  return <AssistantPageView records={records} latest={latest} />;
}

function AssistantPageView({ records, latest }: { records: StudySenseRecord[]; latest: StudySenseRecord }) {
  const { prefs } = usePreferences();
  const [checking, setChecking] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      source: "demo",
      text: "The StudySense agent isn't reachable, so you're talking to a demo responder that reads the latest record only. Ask about temperature, light, noise or presence.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages, thinking]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", source: "demo", text: demoReply(t, latest, prefs) }]);
      setThinking(false);
    }, 450);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };
  const retry = () => {
    setChecking(true);
    setTimeout(() => setChecking(false), 900);
  };

  return (
    <>
      <PageHeader eyebrow="LangGraph agent adapter" title="AI Assistant">
        <DemoBadge />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="panel flex h-[640px] flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                    m.role === "user" ? "bg-secondary" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[80%] ${m.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block rounded-lg px-4 py-2.5 text-left text-sm leading-relaxed ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.source === "demo" && (
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-demo">Demo responder · not the agent</div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-2 pl-11 text-xs text-muted-foreground">
                <StatusDot tone="info" pulse /> Reading latest record…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about your study space…"
                rows={1}
                className="min-h-[44px] resize-none"
              />
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!input.trim() || thinking} aria-label="Send">
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="eyebrow">Agent status</div>
            <div className="mt-3 flex items-center gap-2">
              <StatusDot tone={checking ? "info" : "bad"} pulse={checking} />
              <span className="font-semibold">{checking ? "Checking…" : "Unavailable"}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-2">
              <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
              <code className="readout truncate text-xs">{AGENT_PATH}</code>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The agent couldn't be loaded. Chat falls back to a demo responder until it's available.
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={retry} disabled={checking}>
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} /> Retry connection
            </Button>
          </div>

          <div className="panel p-5">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span className="eyebrow">Allowed actions</span>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {ALLOWED_ACTIONS.map((a) => (
                <li key={a} className="flex items-center gap-2">
                  <StatusDot tone="ok" /> {ACTION_LABELS[a]}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">The assistant can't run anything outside this list.</p>
          </div>

          <div className="panel p-5 text-xs text-muted-foreground">
            <div className="eyebrow mb-2">Privacy</div>
            Answers use stored records only. The assistant never captures new camera or microphone data, and never shares face images or identities.
          </div>
        </aside>
      </div>
    </>
  );
}
