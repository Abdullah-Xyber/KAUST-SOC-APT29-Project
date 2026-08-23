import type { RunStatus, Severity, ValidationOutcome } from "@/lib/domain/types";
import type { BadgeProps } from "@/components/ui/primitives";

type Tone = NonNullable<BadgeProps["tone"]>;

export const OUTCOME_BADGE: Record<ValidationOutcome, { label: string; tone: Tone }> = {
  detected: { label: "Detected", tone: "good" },
  "partially-detected": { label: "Partially detected", tone: "warning" },
  missed: { label: "Missed", tone: "critical" },
  blocked: { label: "Blocked", tone: "brand" },
};

export const SEVERITY_BADGE: Record<Severity, { label: string; tone: Tone }> = {
  critical: { label: "Critical", tone: "critical" },
  high: { label: "High", tone: "serious" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "neutral" },
  informational: { label: "Informational", tone: "outline" },
};

export const RUN_STATUS_BADGE: Record<RunStatus, { label: string; tone: Tone }> = {
  completed: { label: "Completed", tone: "good" },
  running: { label: "Running", tone: "brand" },
  failed: { label: "Failed", tone: "critical" },
  partial: { label: "Partial", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "neutral" },
};
