"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button, Field, Input } from "@/components/ui/primitives";
import type { Integration } from "@/lib/domain/types";

/**
 * Configuration is intentionally local-only: this exhibition build has no
 * backend to persist credentials against, so saving simply confirms the
 * shape a real adapter would take (`adapterId` + these fields) without
 * pretending to call an API that doesn't exist.
 */
export function ConfigureDialog({
  integration,
  open,
  onClose,
}: {
  integration: Integration;
  open: boolean;
  onClose: () => void;
}) {
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (open) setSaved(false);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Configure ${integration.name}`}
      description={`Adapter: ${integration.adapterId} · these fields map directly onto the real ${integration.vendor} API when connected.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setSaved(true)}>
            Save configuration
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {integration.configFields.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input type={f.secret ? "password" : "text"} placeholder={f.placeholder} defaultValue={f.secret ? "" : integration.endpoint.includes(f.placeholder) ? "" : undefined} />
          </Field>
        ))}
        {saved && (
          <p className="rounded-lg bg-[color:var(--good-soft)] px-3 py-2 text-xs font-medium text-[color:var(--good-ink)]">
            Configuration saved locally. In a connected deployment this would call the {integration.vendor} API to
            validate credentials.
          </p>
        )}
      </div>
    </Dialog>
  );
}
