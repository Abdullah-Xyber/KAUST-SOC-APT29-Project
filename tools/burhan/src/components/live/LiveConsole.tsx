"use client";

import * as React from "react";
import type { TimelineEvent } from "@/lib/engine/timeline";
import { formatTime } from "@/lib/utils";

const KIND_COLOR: Record<TimelineEvent["kind"], string> = {
  attack: "#ff8a80",
  telemetry: "#9fb8cc",
  detection: "#ffcf6b",
  incident: "#5fd0ef",
  acknowledge: "#5fd0ef",
  triage: "#5fd0ef",
  escalate: "#ffcf6b",
  response: "#7be0a8",
  contain: "#7be0a8",
  resolve: "#7be0a8",
};

const KIND_PREFIX: Record<TimelineEvent["kind"], string> = {
  attack: "ATTACK",
  telemetry: "TELEMETRY",
  detection: "DETECT",
  incident: "INCIDENT",
  acknowledge: "SOC",
  triage: "SOC",
  escalate: "SOC",
  response: "RESPONSE",
  contain: "CONTAIN",
  resolve: "RESOLVE",
};

/** Dark, monospace, auto-scrolling event feed — the exhibition centrepiece. */
export function LiveConsole({ events }: { events: TimelineEvent[] }) {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#04121e]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[11px] text-white/40">burhan — live validation feed</span>
      </div>
      <div className="h-[420px] overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
        {events.length === 0 ? (
          <p className="text-white/30">Waiting for validation to start…</p>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex gap-2 py-0.5">
              <span className="shrink-0 text-white/30">[{formatTime(e.timestamp)}]</span>
              <span className="shrink-0 font-semibold" style={{ color: KIND_COLOR[e.kind] }}>
                {KIND_PREFIX[e.kind]}
              </span>
              <span className="text-white/80">
                {e.title}
                {e.hostname && <span className="text-white/40"> · {e.hostname}</span>}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
