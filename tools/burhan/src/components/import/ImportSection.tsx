"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";

/**
 * Generic three-mode importer (Manual / JSON / CSV) shared by all three Data
 * Import sections (§14). `T` is the row shape (e.g. AttackRow); the caller
 * supplies field metadata and a mapper into the normalized domain model.
 */
export function ImportSection<T extends Record<string, string>>({
  fields,
  emptyRow,
  exampleRow,
  mapRow,
  onImport,
  successLabel,
}: {
  fields: readonly string[];
  emptyRow: T;
  exampleRow: T;
  mapRow: (row: Partial<T>) => { data: unknown; errors: string[] };
  onImport: (data: unknown) => void;
  successLabel: (n: number) => string;
}) {
  return (
    <Tabs defaultValue="manual">
      <TabsList>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="json">JSON Import</TabsTrigger>
        <TabsTrigger value="csv">CSV Import</TabsTrigger>
      </TabsList>

      <TabsContent value="manual" className="mt-4">
        <ManualForm fields={fields} emptyRow={emptyRow} mapRow={mapRow} onImport={onImport} />
      </TabsContent>

      <TabsContent value="json" className="mt-4">
        <BulkForm
          mode="json"
          exampleText={JSON.stringify([exampleRow], null, 2)}
          mapRow={mapRow}
          onImport={onImport}
          successLabel={successLabel}
        />
      </TabsContent>

      <TabsContent value="csv" className="mt-4">
        <BulkForm
          mode="csv"
          exampleText={[fields.join(","), fields.map((f) => csvEscape((exampleRow as Record<string, string>)[f] ?? "")).join(",")].join("\n")}
          mapRow={mapRow}
          onImport={onImport}
          successLabel={successLabel}
        />
      </TabsContent>
    </Tabs>
  );
}

function csvEscape(value: string) {
  return value.includes(",") || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
}

/* ------------------------------------------------------------- manual -- */

function ManualForm<T extends Record<string, string>>({
  fields,
  emptyRow,
  mapRow,
  onImport,
}: {
  fields: readonly string[];
  emptyRow: T;
  mapRow: (row: Partial<T>) => { data: unknown; errors: string[] };
  onImport: (data: unknown) => void;
}) {
  const [row, setRow] = React.useState<T>(emptyRow);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [success, setSuccess] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = mapRow(row);
    if (result.errors.length || !result.data) {
      setErrors(result.errors);
      setSuccess(false);
      return;
    }
    onImport(result.data);
    setErrors([]);
    setSuccess(true);
    setRow(emptyRow);
    window.setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f} label={f}>
            <Input
              value={row[f] ?? ""}
              onChange={(e) => setRow((r) => ({ ...r, [f]: e.target.value }))}
              placeholder={f.toLowerCase().includes("time") || f.toLowerCase().includes("timestamp") ? "2026-08-21T09:15:00Z" : ""}
            />
          </Field>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-[color:var(--critical)]/30 bg-[color:var(--critical-soft)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--critical-ink)]">
            <AlertCircle className="h-3.5 w-3.5" /> Fix the following before importing
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-[color:var(--critical-ink)]/90">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {success && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--good-ink)]">
          <CheckCircle2 className="h-3.5 w-3.5" /> Record imported and included in scoring.
        </p>
      )}

      <Button type="submit" variant="primary">
        Add record
      </Button>
    </form>
  );
}

/* --------------------------------------------------------- json / csv -- */

function BulkForm<T extends Record<string, string>>({
  mode,
  exampleText,
  mapRow,
  onImport,
  successLabel,
}: {
  mode: "json" | "csv";
  exampleText: string;
  mapRow: (row: Partial<T>) => { data: unknown; errors: string[] };
  onImport: (data: unknown) => void;
  successLabel: (n: number) => string;
}) {
  const [text, setText] = React.useState(exampleText);
  const [result, setResult] = React.useState<{ ok: number; rowErrors: { index: number; errors: string[] }[]; parseError: string | null } | null>(null);

  async function run() {
    const { parseCsv, parseJsonRows } = await import("@/lib/import/parse");
    const { rows, error } = mode === "json" ? parseJsonRows(text) : { rows: parseCsv(text), error: null };
    if (error) {
      setResult({ ok: 0, rowErrors: [], parseError: error });
      return;
    }
    if (!rows.length) {
      setResult({ ok: 0, rowErrors: [], parseError: "No rows found." });
      return;
    }
    let ok = 0;
    const rowErrors: { index: number; errors: string[] }[] = [];
    rows.forEach((row, i) => {
      const mapped = mapRow(row as Partial<T>);
      if (mapped.errors.length || !mapped.data) {
        rowErrors.push({ index: i + 1, errors: mapped.errors.length ? mapped.errors : ["Could not parse this row."] });
      } else {
        onImport(mapped.data);
        ok += 1;
      }
    });
    setResult({ ok, rowErrors, parseError: null });
  }

  return (
    <div className="space-y-3">
      <Field label={mode === "json" ? "JSON array of records" : "CSV (first row is the header)"} hint="Edit the example below or paste your own export.">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} />
      </Field>

      {result && (
        <div className="space-y-2">
          {result.parseError ? (
            <p className="flex items-center gap-1.5 rounded-lg border border-[color:var(--critical)]/30 bg-[color:var(--critical-soft)] p-2.5 text-xs font-medium text-[color:var(--critical-ink)]">
              <AlertCircle className="h-3.5 w-3.5" /> {result.parseError}
            </p>
          ) : (
            <>
              {result.ok > 0 && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--good-ink)]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {successLabel(result.ok)}
                </p>
              )}
              {result.rowErrors.length > 0 && (
                <div className="rounded-lg border border-[color:var(--critical)]/30 bg-[color:var(--critical-soft)] p-3">
                  <p className="text-xs font-semibold text-[color:var(--critical-ink)]">
                    {result.rowErrors.length} row{result.rowErrors.length === 1 ? "" : "s"} could not be imported
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-[color:var(--critical-ink)]/90">
                    {result.rowErrors.map((re) => (
                      <li key={re.index}>
                        Row {re.index}: {re.errors.join("; ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Button variant="primary" onClick={run}>
        <UploadCloud className="h-3.5 w-3.5" />
        Parse &amp; Import
      </Button>
    </div>
  );
}
