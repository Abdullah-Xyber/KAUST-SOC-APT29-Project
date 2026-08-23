import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  PlayCircle,
  Gauge,
  Grid3x3,
  UploadCloud,
  Plug,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short line shown as a tooltip / description in the collapsed rail. */
  description: string;
}

/** The six pages the product is built around — nothing else lives in the main rail. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Executive SOC & IR readiness overview" },
  { href: "/runs", label: "Validation Runs", icon: PlayCircle, description: "Adversary emulation exercises" },
  { href: "/soc-ir-metrics", label: "SOC & IR Metrics", icon: Gauge, description: "Detection and response performance" },
  { href: "/mitre-coverage", label: "MITRE Coverage", icon: Grid3x3, description: "Technique coverage in this demo" },
  { href: "/data-import", label: "Data Import", icon: UploadCloud, description: "Manual, CSV and JSON ingestion" },
  { href: "/integrations", label: "Integrations", icon: Plug, description: "What Burhan can connect to" },
];
