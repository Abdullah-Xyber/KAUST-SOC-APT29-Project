"use client";

import { Crosshair, Siren, ShieldAlert, Info } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/primitives";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImportSection } from "@/components/import/ImportSection";
import {
  ATTACK_FIELDS,
  DETECTION_FIELDS,
  IR_FIELDS,
  EMPTY_ATTACK_ROW,
  EMPTY_DETECTION_ROW,
  EMPTY_IR_ROW,
  ATTACK_EXAMPLE,
  DETECTION_EXAMPLE,
  IR_EXAMPLE,
} from "@/lib/import/schema";
import { mapAttackRow, mapDetectionRow, mapIrActionRow, type IrActionImport } from "@/lib/import/parse";
import { useBurhan, MANUAL_IMPORT_RUN_ID } from "@/lib/state/DataProvider";
import type { AttackEvent, DetectionEvent } from "@/lib/domain/types";
import Link from "next/link";

export default function DataImportPage() {
  const { importAttackEvent, importDetectionEvent, importIrAction, importedCounts } = useBurhan();

  return (
    <div className="space-y-5 fade-up">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--ink)]">Data Import</h2>
        <p className="text-xs text-[color:var(--ink-muted)]">
          Import attack, detection, and response evidence when direct integration is unavailable.
        </p>
      </div>

      {(importedCounts.attacks > 0 || importedCounts.detections > 0 || importedCounts.irActions > 0) && (
        <Card className="flex items-center gap-3 border-[color:var(--primary)]/25 bg-[color:var(--primary-soft)] p-4">
          <Info className="h-4 w-4 shrink-0 text-[color:var(--primary)]" />
          <p className="text-xs text-[color:var(--ink-secondary)]">
            <span className="font-semibold text-[color:var(--ink)]">
              {importedCounts.attacks} attack event{importedCounts.attacks === 1 ? "" : "s"}, {importedCounts.detections}{" "}
              detection{importedCounts.detections === 1 ? "" : "s"} and {importedCounts.irActions} IR action
              {importedCounts.irActions === 1 ? "" : "s"} across {importedCounts.incidents} incident
              {importedCounts.incidents === 1 ? "" : "s"}
            </span>{" "}
            imported so far. They&apos;re grouped into{" "}
            <Link href={`/runs/${MANUAL_IMPORT_RUN_ID}`} className="font-medium text-[color:var(--primary)] hover:underline">
              {MANUAL_IMPORT_RUN_ID}
            </Link>{" "}
            and already reflected in every score and chart — the same correlation and scoring engine a live
            integration would feed.
          </p>
        </Card>
      )}

      <Tabs defaultValue="attack">
        <TabsList>
          <TabsTrigger value="attack">Attack / Emulation Data</TabsTrigger>
          <TabsTrigger value="detection">SIEM Detection Data</TabsTrigger>
          <TabsTrigger value="ir">IR Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="attack" className="mt-4">
          <Card>
            <CardHeader
              icon={<Crosshair className="h-4 w-4" />}
              title="Attack / Emulation Data"
              description="What an adversary emulation tool executed, and where"
            />
            <CardBody>
              <ImportSection
                fields={ATTACK_FIELDS}
                emptyRow={EMPTY_ATTACK_ROW}
                exampleRow={ATTACK_EXAMPLE}
                mapRow={mapAttackRow}
                onImport={(data) => importAttackEvent(data as Omit<AttackEvent, "id" | "runId" | "raw">)}
                successLabel={(n) => `Imported ${n} attack event${n === 1 ? "" : "s"}.`}
              />
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="detection" className="mt-4">
          <Card>
            <CardHeader
              icon={<Siren className="h-4 w-4" />}
              title="SIEM Detection Data"
              description="Alerts your SIEM raised in response to the attack"
            />
            <CardBody>
              <ImportSection
                fields={DETECTION_FIELDS}
                emptyRow={EMPTY_DETECTION_ROW}
                exampleRow={DETECTION_EXAMPLE}
                mapRow={mapDetectionRow}
                onImport={(data) => importDetectionEvent(data as Omit<DetectionEvent, "id" | "runId" | "raw">)}
                successLabel={(n) => `Imported ${n} detection${n === 1 ? "" : "s"}.`}
              />
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="ir" className="mt-4">
          <Card>
            <CardHeader
              icon={<ShieldAlert className="h-4 w-4" />}
              title="IR Evidence"
              description="One action per row — rows sharing the same Incident label accumulate onto the same incident, across detection & triage, containment, eradication and recovery."
            />
            <CardBody>
              <ImportSection
                fields={IR_FIELDS}
                emptyRow={EMPTY_IR_ROW}
                exampleRow={IR_EXAMPLE}
                mapRow={mapIrActionRow}
                onImport={(data) => importIrAction(data as IrActionImport)}
                successLabel={(n) => `Imported ${n} IR action${n === 1 ? "" : "s"}.`}
              />
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
