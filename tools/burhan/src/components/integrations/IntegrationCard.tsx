"use client";

import * as React from "react";
import { Crosshair, Database, Workflow, Info } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";
import type { Integration } from "@/lib/domain/types";
import { ConfigureDialog } from "@/components/integrations/ConfigureDialog";

const CATEGORY_ICON = { emulation: Crosshair, siem: Database, response: Workflow } as const;

/**
 * Every card here is a prototype connector — no real API calls happen in
 * this build. "Test Connection" deliberately does not simulate a fake
 * success animation; it opens a short, honest explanation instead, per the
 * product rule that Burhan never implies real API communication occurred.
 */
export function IntegrationCard({ integration }: { integration: Integration }) {
  const [configOpen, setConfigOpen] = React.useState(false);
  const [infoOpen, setInfoOpen] = React.useState(false);
  const Icon = CATEGORY_ICON[integration.category];

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--surface-sunken)] text-[color:var(--ink-secondary)]">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--ink)]">{integration.name}</p>
            <p className="text-[11px] text-[color:var(--ink-muted)]">{integration.vendor}</p>
          </div>
        </div>
        <Badge tone="outline">Prototype Connector</Badge>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[color:var(--ink-secondary)]">{integration.description}</p>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => setConfigOpen(true)}>
          Configure
        </Button>
        <Button size="sm" variant="primary" className="flex-1" onClick={() => setInfoOpen(true)}>
          <Info className="h-3.5 w-3.5" /> Test Connection
        </Button>
      </div>

      <ConfigureDialog integration={integration} open={configOpen} onClose={() => setConfigOpen(false)} />

      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Prototype connector"
        footer={
          <Button variant="primary" onClick={() => setInfoOpen(false)}>
            Got it
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-[color:var(--ink-secondary)]">
          This prototype currently uses imported or simulated data. Burhan is not making a live API call to{" "}
          {integration.vendor} — <strong className="text-[color:var(--ink)]">live API integration is future work</strong>.
          The adapter interface (<code className="text-xs">{integration.adapterId}</code>) is already shaped for it;
          connecting a real credential here is what a production deployment would need.
        </p>
      </Dialog>
    </Card>
  );
}
