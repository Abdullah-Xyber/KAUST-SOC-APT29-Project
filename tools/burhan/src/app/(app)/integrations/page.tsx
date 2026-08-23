"use client";

import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { useBurhan } from "@/lib/state/DataProvider";

export default function IntegrationsPage() {
  const { dataset } = useBurhan();

  return (
    <div className="space-y-4 fade-up">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--ink)]">Integrations</h2>
        <p className="text-xs text-[color:var(--ink-muted)]">Future connectors for automated evidence collection.</p>
        <p className="mt-1 text-xs text-[color:var(--ink-muted)]">
          This prototype currently uses imported or simulated data. Live API integration is future work.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dataset.integrations.map((i) => (
          <IntegrationCard key={i.id} integration={i} />
        ))}
      </div>
    </div>
  );
}
