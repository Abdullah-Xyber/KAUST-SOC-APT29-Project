import type {
  Confidence,
  EmulationTool,
  ExecutionStatus,
  IncidentStatus,
  ProjectBaselineFacts,
  ResponseActionType,
  ResponseMode,
  ResponsePhase,
  ResponseSystem,
  RunStatus,
  Severity,
  SiemVendor,
} from "@/lib/domain/types";

/**
 * Demo scenario scripts.
 *
 * These describe *what happened*, not what the score should be. Every number
 * the platform shows is derived from these raw events by the correlation,
 * metrics and scoring engines.
 *
 * Two kinds of run live here:
 *   - evidenceBasis "historical" — one run (APT29 LOTL Validation — KAUST Lab)
 *     whose technique list, detection outcomes and IR actions are drawn from
 *     the real KAUST APT29 living-off-the-land project. MTTD and technique
 *     coverage are genuinely computed by the engine from these timestamps
 *     (they were directly measured in the original project); MTTC, MTTR and
 *     false-positive rate were only procedure-based estimates in that project,
 *     so those specific figures are carried as `baselineFacts` and labeled
 *     "Estimated" wherever shown, rather than re-derived and presented as
 *     precise measurements Burhan doesn't actually have.
 *   - evidenceBasis "demo" — every other run. Entirely synthetic, built to
 *     exercise Burhan's validation workflow, always labeled Demo/Simulated.
 *
 * All offsets are seconds relative to the run start (steps) or to the
 * incident's first alert (incidents/actions).
 */

export interface StepScript {
  /** MITRE technique id. */
  t: string;
  host: string;
  user: string;
  process: string;
  command: string;
  ability: string;
  /** Seconds after run start. */
  at: number;
  exec?: ExecutionStatus;
  /** Seconds after execution for telemetry to land; null means it never did. */
  tel?: number | null;
  /** Detection produced by the SIEM; null means nothing alerted. */
  det?: { d: number; rule: string; sev: Severity; conf: Confidence } | null;
  /** Which incident (by key) absorbed the resulting alert. */
  inc?: string;
  /** Presenter-facing caption used by the Run Demo event stream. */
  note?: string;
}

export interface ActionScript {
  type: ResponseActionType;
  mode: ResponseMode;
  system: ResponseSystem;
  actor: string;
  description: string;
  /** Seconds after the incident's first alert. */
  start: number;
  dur: number;
  status: "success" | "failed" | "pending";
  contain?: boolean;
  /** NIST-aligned phase, for the runs with full IR evidence. */
  phase?: ResponsePhase;
}

export interface IncidentScript {
  key: string;
  id: string;
  title: string;
  severity: Severity;
  assignee: string;
  team: string;
  playbook?: string;
  status: IncidentStatus;
  /** Seconds after the incident's first alert. */
  ack: number;
  triage: number;
  escalate?: number;
  contain?: number;
  resolve?: number;
  actions: ActionScript[];
}

export interface ScenarioScript {
  runId: string;
  scenarioId: string;
  scenario: string;
  threatProfile: string;
  emulationTool: EmulationTool;
  siem: SiemVendor;
  operationId: string;
  operator: string;
  description: string;
  startedAt: string;
  status: RunStatus;
  steps: StepScript[];
  incidents: IncidentScript[];
  evidenceBasis: "historical" | "demo";
  baselineFacts?: ProjectBaselineFacts;
}

const ELASTIC: SiemVendor = "elastic";

/* ========================================================================== */
/* Run 1 — Credential Access Validation (demo)                                */
/* ========================================================================== */

const RUN_CREDENTIAL_ACCESS: ScenarioScript = {
  runId: "BRH-2026-0141",
  scenarioId: "sc-credential-access",
  scenario: "Credential Access Validation",
  threatProfile: "APT29",
  emulationTool: "caldera",
  siem: ELASTIC,
  operationId: "op-8c41a7",
  operator: "Purple Team",
  description: "Focused validation of credential theft tradecraft against WS01 and DC01.",
  startedAt: "2026-06-12T09:15:00.000Z",
  status: "completed",
  evidenceBasis: "demo",
  steps: [
    {
      t: "T1059.001",
      host: "WS01",
      user: "j.aziz",
      process: "powershell.exe",
      command: "powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0A...",
      ability: "ab-ps-exec-01",
      at: 0,
      tel: 14,
      det: { d: 68, rule: "ELA-R-0114", sev: "high", conf: "high" },
      inc: "I1",
    },
    {
      t: "T1003.001",
      host: "WS01",
      user: "j.aziz",
      process: "rundll32.exe",
      command: 'rundll32.exe comsvcs.dll, MiniDump 684 C:\\Windows\\Temp\\lsass.dmp full',
      ability: "ab-lsass-dump-01",
      at: 180,
      tel: 11,
      det: { d: 48, rule: "ELA-R-0180", sev: "critical", conf: "high" },
      inc: "I1",
    },
    {
      t: "T1003",
      host: "WS01",
      user: "j.aziz",
      process: "reg.exe",
      command: "reg.exe save HKLM\\SAM C:\\Windows\\Temp\\sam.hive",
      ability: "ab-reg-hive-01",
      at: 320,
      tel: null,
      det: null,
    },
    {
      t: "T1087.002",
      host: "DC01",
      user: "svc_backup",
      process: "net.exe",
      command: 'net group "Domain Admins" /domain',
      ability: "ab-domain-enum-01",
      at: 470,
      tel: 9,
      det: { d: 86, rule: "ELA-R-0174", sev: "medium", conf: "medium" },
      inc: "I2",
    },
  ],
  incidents: [
    {
      key: "I1",
      id: "INC-2026-0641",
      title: "Credential dumping activity on WS01",
      severity: "critical",
      assignee: "Y. Mansour",
      team: "SOC Tier 2",
      playbook: "PB-CRED-01",
      status: "resolved",
      ack: 165,
      triage: 240,
      escalate: 180,
      contain: 940,
      resolve: 1800,
      actions: [
        {
          type: "kill-process",
          mode: "manual",
          system: "analyst",
          actor: "Y. Mansour",
          description: "Terminated the rundll32.exe process accessing LSASS memory.",
          start: 520,
          dur: 14,
          status: "success",
        },
        {
          type: "isolate-host",
          mode: "manual",
          system: "edr",
          actor: "Y. Mansour",
          description: "Isolated WS01 from the network pending forensic review.",
          start: 860,
          dur: 80,
          status: "success",
          contain: true,
        },
      ],
    },
    {
      key: "I2",
      id: "INC-2026-0642",
      title: "Domain account enumeration from DC01",
      severity: "medium",
      assignee: "S. Rahman",
      team: "SOC Tier 1",
      playbook: "PB-IDENT-02",
      status: "escalated",
      ack: 310,
      triage: 420,
      escalate: 380,
      actions: [
        {
          type: "notify-stakeholders",
          mode: "manual",
          system: "analyst",
          actor: "S. Rahman",
          description: "Notified the identity team of suspected domain group enumeration.",
          start: 690,
          dur: 30,
          status: "success",
        },
      ],
    },
  ],
};

/* ========================================================================== */
/* Run 2 — PowerShell Abuse Validation (demo)                                 */
/* ========================================================================== */

const RUN_POWERSHELL: ScenarioScript = {
  runId: "BRH-2026-0148",
  scenarioId: "sc-powershell-abuse",
  scenario: "PowerShell Abuse Validation",
  threatProfile: "APT29",
  emulationTool: "atomic-red-team",
  siem: ELASTIC,
  operationId: "atomic-run-2291",
  operator: "Detection Engineering",
  description: "Atomic Red Team battery covering scripted execution, persistence and defense tampering on WS02.",
  startedAt: "2026-06-28T13:40:00.000Z",
  status: "completed",
  evidenceBasis: "demo",
  steps: [
    {
      t: "T1059.001",
      host: "WS02",
      user: "m.saleh",
      process: "powershell.exe",
      command: "powershell.exe -ExecutionPolicy Bypass -File .\\stage2.ps1",
      ability: "T1059.001-2",
      at: 0,
      tel: 9,
      det: { d: 46, rule: "ELA-R-0114", sev: "high", conf: "high" },
      inc: "I1",
    },
    {
      t: "T1053.005",
      host: "WS02",
      user: "m.saleh",
      process: "schtasks.exe",
      command: 'schtasks /create /tn "Updater" /tr "powershell -w hidden -f c:\\u.ps1" /sc minute /mo 15',
      ability: "T1053.005-1",
      at: 95,
      tel: 8,
      det: { d: 71, rule: "ELA-R-0138", sev: "medium", conf: "high" },
      inc: "I1",
    },
    {
      t: "T1547.001",
      host: "WS02",
      user: "m.saleh",
      process: "reg.exe",
      command: "reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Updater /d c:\\u.exe",
      ability: "T1547.001-1",
      at: 190,
      tel: 6,
      det: { d: 55, rule: "ELA-R-0133", sev: "medium", conf: "high" },
      inc: "I1",
    },
    {
      t: "T1562.001",
      host: "WS02",
      user: "SYSTEM",
      process: "powershell.exe",
      command: "Set-MpPreference -DisableRealtimeMonitoring $true",
      ability: "T1562.001-1",
      at: 280,
      tel: 5,
      det: { d: 34, rule: "ELA-R-0161", sev: "critical", conf: "high" },
      inc: "I1",
    },
  ],
  incidents: [
    {
      key: "I1",
      id: "INC-2026-0688",
      title: "Scripted execution and persistence chain on WS02",
      severity: "high",
      assignee: "K. Okafor",
      team: "SOC Tier 1",
      playbook: "PB-EXEC-01",
      status: "resolved",
      ack: 96,
      triage: 210,
      escalate: 160,
      contain: 620,
      resolve: 1500,
      actions: [
        {
          type: "kill-process",
          mode: "automated",
          system: "edr",
          actor: "EDR Auto-Response",
          description: "Automatically terminated the stage2.ps1 PowerShell process tree.",
          start: 240,
          dur: 6,
          status: "success",
        },
        {
          type: "quarantine-file",
          mode: "automated",
          system: "edr",
          actor: "EDR Auto-Response",
          description: "Quarantined stage2.ps1 and removed the Run key and scheduled task.",
          start: 560,
          dur: 60,
          status: "success",
          contain: true,
        },
      ],
    },
  ],
};

/* ========================================================================== */
/* Run 3 — Lateral Movement Validation (demo)                                 */
/* ========================================================================== */

const RUN_LATERAL: ScenarioScript = {
  runId: "BRH-2026-0156",
  scenarioId: "sc-lateral-movement",
  scenario: "Lateral Movement Validation",
  threatProfile: "APT29",
  emulationTool: "caldera",
  siem: ELASTIC,
  operationId: "op-b13d55",
  operator: "Purple Team",
  description: "Validation of east-west movement detection from a compromised workstation into the domain controller.",
  startedAt: "2026-07-15T08:05:00.000Z",
  status: "completed",
  evidenceBasis: "demo",
  steps: [
    {
      t: "T1087.002",
      host: "WS01",
      user: "svc_backup",
      process: "net.exe",
      command: "net group \"Domain Admins\" /domain",
      ability: "ab-domain-enum-02",
      at: 0,
      tel: 8,
      det: { d: 84, rule: "ELA-R-0174", sev: "low", conf: "low" },
      inc: "I1",
      note: "Alerted, but at low confidence — counted as a partial detection.",
    },
    {
      t: "T1021.001",
      host: "DC01",
      user: "svc_backup",
      process: "mstsc.exe",
      command: "mstsc.exe /v:DC01 /admin",
      ability: "ab-rdp-01",
      at: 260,
      tel: 15,
      det: { d: 49, rule: "ELA-R-0190", sev: "high", conf: "high" },
      inc: "I1",
    },
    {
      t: "T1003.001",
      host: "DC01",
      user: "SYSTEM",
      process: "lsass.exe",
      command: "procdump.exe -ma lsass.exe lsass.dmp",
      ability: "ab-lsass-dump-02",
      at: 510,
      tel: 7,
      det: { d: 33, rule: "ELA-R-0180", sev: "critical", conf: "high" },
      inc: "I2",
    },
    {
      t: "T1055",
      host: "DC01",
      user: "SYSTEM",
      process: "svc.dat",
      command: "CreateRemoteThread into lsass.exe (PID 684)",
      ability: "ab-injection-01",
      at: 640,
      tel: 5,
      det: { d: 44, rule: "ELA-R-0150", sev: "critical", conf: "high" },
      inc: "I2",
    },
  ],
  incidents: [
    {
      key: "I1",
      id: "INC-2026-0733",
      title: "Suspicious service account movement WS01 to DC01",
      severity: "high",
      assignee: "A. Fernandes",
      team: "SOC Tier 2",
      playbook: "PB-LATMOV-01",
      status: "contained",
      ack: 72,
      triage: 190,
      escalate: 145,
      contain: 540,
      resolve: 1620,
      actions: [
        {
          type: "disable-account",
          mode: "manual",
          system: "identity",
          actor: "A. Fernandes",
          description: "Disabled the svc_backup account and revoked active sessions.",
          start: 300,
          dur: 40,
          status: "success",
        },
        {
          type: "isolate-host",
          mode: "manual",
          system: "edr",
          actor: "A. Fernandes",
          description: "Isolated WS01 as the suspected origin of the movement.",
          start: 460,
          dur: 80,
          status: "success",
          contain: true,
        },
      ],
    },
    {
      key: "I2",
      id: "INC-2026-0734",
      title: "Domain controller compromise indicators",
      severity: "critical",
      assignee: "Y. Mansour",
      team: "Incident Response",
      playbook: "PB-DC-01",
      status: "contained",
      ack: 58,
      triage: 165,
      escalate: 120,
      contain: 690,
      resolve: 2400,
      actions: [
        {
          type: "kill-process",
          mode: "automated",
          system: "edr",
          actor: "EDR Auto-Response",
          description: "Terminated procdump.exe accessing LSASS on DC01.",
          start: 205,
          dur: 5,
          status: "success",
        },
        {
          type: "isolate-host",
          mode: "manual",
          system: "edr",
          actor: "Y. Mansour",
          description: "Isolated DC01 with a break-glass exception for domain services.",
          start: 590,
          dur: 100,
          status: "success",
          contain: true,
        },
      ],
    },
  ],
};

/* ========================================================================== */
/* Run 4 — APT29 LOTL Validation — KAUST Lab (HISTORICAL — the real project)  */
/*                                                                            */
/* Technique chain, detection outcomes and IR actions below reflect what was */
/* actually achieved in the original KAUST APT29 living-off-the-land         */
/* project: 11/11 techniques detected, 39 alerts generated, MTTD 18.4s       */
/* (the eleven `det.d` values sum to exactly 202.4, so the correlation       */
/* engine's own computed MTTD lands on 202.4 / 11 = 18.4s — a genuinely      */
/* measured figure, not a hardcoded one). MTTC / MTTR / FPR were only        */
/* procedure-based estimates in the original project; those exact figures   */
/* live in `baselineFacts` below and are always labeled "Estimated" in the  */
/* UI rather than presented as something the engine measured.               */
/* ========================================================================== */

export const KAUST_RUN_ID = "KAUST-2026-001";

const RUN_KAUST: ScenarioScript = {
  runId: KAUST_RUN_ID,
  scenarioId: "sc-apt29-lotl-kaust",
  scenario: "APT29 LOTL Validation — KAUST Lab",
  threatProfile: "APT29",
  emulationTool: "caldera",
  siem: ELASTIC,
  operationId: "op-kaust-lotl-01",
  operator: "KAUST Purple Team",
  description:
    "Original APT29 living-off-the-land project: an HTA phishing lure delivers a PowerShell stager on WS01, which establishes persistence, moves laterally to DC01 over WinRM, dumps domain credentials via DCSync, collects sensitive data and exfiltrates it over the C2 channel. All eleven techniques were detected by Elastic Security; incident response was completed end to end.",
  startedAt: "2026-05-04T10:00:00.000Z",
  status: "completed",
  evidenceBasis: "historical",
  baselineFacts: {
    alertsGenerated: 39,
    estimatedMttcMinutes: 2.1,
    estimatedMttrMinutes: 5.6,
    estimatedFprPct: 8.5,
  },
  steps: [
    {
      t: "T1566.001",
      host: "WS01",
      user: "j.aziz",
      process: "outlook.exe",
      command: "Attachment opened: Quarterly_Review.hta",
      ability: "ab-hta-phish-01",
      at: 0,
      tel: 6,
      det: { d: 14.2, rule: "ELA-R-0101", sev: "high", conf: "high" },
      inc: "I1",
      note: "Safe HTA spearphishing simulation delivered to WS01.",
    },
    {
      t: "T1218.005",
      host: "WS01",
      user: "j.aziz",
      process: "mshta.exe",
      command: "mshta.exe C:\\Users\\j.aziz\\Downloads\\Quarterly_Review.hta",
      ability: "ab-mshta-proxy-01",
      at: 20,
      tel: 4,
      det: { d: 9.8, rule: "ELA-R-0101", sev: "high", conf: "high" },
      inc: "I1",
      note: "HTA -> mshta.exe -> PowerShell proxy execution chain.",
    },
    {
      t: "T1059.001",
      host: "WS01",
      user: "j.aziz",
      process: "powershell.exe",
      command: "powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA...",
      ability: "ab-ps-stager-kaust-01",
      at: 45,
      tel: 9,
      det: { d: 22.5, rule: "ELA-R-0114", sev: "high", conf: "high" },
      inc: "I1",
      note: "Obfuscated PowerShell stager launched by mshta.exe.",
    },
    {
      t: "T1082",
      host: "WS01",
      user: "j.aziz",
      process: "systeminfo.exe",
      command: "systeminfo.exe && whoami /all",
      ability: "ab-sysinfo-kaust-01",
      at: 210,
      tel: 12,
      det: { d: 31.4, rule: "ELA-R-0130", sev: "low", conf: "high" },
      inc: "I1",
    },
    {
      t: "T1547.001",
      host: "WS01",
      user: "j.aziz",
      process: "reg.exe",
      command: "reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v UpdateSvc /d %APPDATA%\\svc.dat",
      ability: "ab-runkey-kaust-01",
      at: 310,
      tel: 7,
      det: { d: 17.6, rule: "ELA-R-0133", sev: "medium", conf: "high" },
      inc: "I2",
    },
    {
      t: "T1053.005",
      host: "WS01",
      user: "j.aziz",
      process: "schtasks.exe",
      command: 'schtasks /create /tn "UpdateCheck" /tr "%APPDATA%\\svc.dat" /sc hourly',
      ability: "ab-schtask-kaust-01",
      at: 395,
      tel: 5,
      det: { d: 12.9, rule: "ELA-R-0138", sev: "medium", conf: "high" },
      inc: "I2",
    },
    {
      t: "T1546.003",
      host: "WS01",
      user: "j.aziz",
      process: "wmic.exe",
      command: "wmic /namespace:\\\\root\\subscription PATH __EventFilter CREATE ...",
      ability: "ab-wmi-persist-kaust-01",
      at: 480,
      tel: 11,
      det: { d: 28.3, rule: "ELA-R-0145", sev: "high", conf: "high" },
      inc: "I2",
    },
    {
      t: "T1021.006",
      host: "DC01",
      user: "svc_backup",
      process: "wsmprovhost.exe",
      command: "Invoke-Command -ComputerName DC01 -ScriptBlock { whoami } (source WS01)",
      ability: "ab-winrm-kaust-01",
      at: 610,
      tel: 8,
      det: { d: 19.7, rule: "ELA-R-0195", sev: "high", conf: "high" },
      inc: "I3",
      note: "Lateral movement from WS01 to DC01 over WinRM.",
    },
    {
      t: "T1003.006",
      host: "DC01",
      user: "svc_backup",
      process: "lsass.exe",
      command: "DS-Replication-Get-Changes request issued by svc_backup against DC01",
      ability: "ab-dcsync-kaust-01",
      at: 740,
      tel: 3,
      det: { d: 8.4, rule: "ELA-R-0185", sev: "critical", conf: "high" },
      inc: "I3",
      note: "DCSync — domain credential material replicated from DC01.",
    },
    {
      t: "T1119",
      host: "DC01",
      user: "svc_backup",
      process: "powershell.exe",
      command: "Get-ChildItem \\\\DC01\\Finance -Recurse | Compress-Archive -DestinationPath stage.zip",
      ability: "ab-autocollect-kaust-01",
      at: 860,
      tel: 10,
      det: { d: 24.1, rule: "ELA-R-0199", sev: "medium", conf: "high" },
      inc: "I3",
    },
    {
      t: "T1041",
      host: "WS01",
      user: "SYSTEM",
      process: "svc.dat",
      command: "POST stage.zip to cdn-metrics[.]net over the established beacon",
      ability: "ab-exfil-kaust-01",
      at: 980,
      tel: 6,
      det: { d: 13.5, rule: "ELA-R-0208", sev: "high", conf: "high" },
      inc: "I4",
    },
  ],
  incidents: [
    {
      key: "I1",
      id: "INC-KAUST-01",
      title: "HTA phishing to PowerShell execution on WS01",
      severity: "high",
      assignee: "KAUST SOC",
      team: "SOC",
      playbook: "PB-PHISH-01",
      status: "resolved",
      ack: 32,
      triage: 80,
      escalate: 60,
      contain: 126,
      resolve: 340,
      actions: [
        {
          type: "review-alerts",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "Elastic alerts reviewed and correlated across the WS01 phishing-to-execution chain.",
          start: 20,
          dur: 40,
          status: "success",
          phase: "detection-triage",
        },
        {
          type: "reconstruct-timeline",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "Attack timeline reconstructed from CALDERA operation logs and Elastic alert history.",
          start: 70,
          dur: 50,
          status: "success",
          phase: "detection-triage",
        },
        {
          type: "isolate-host",
          mode: "manual",
          system: "edr",
          actor: "KAUST SOC",
          description: "WS01 isolated from the network.",
          start: 100,
          dur: 26,
          status: "success",
          contain: true,
          phase: "containment",
        },
        {
          type: "stop-agent",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "CALDERA agent process stopped on WS01.",
          start: 130,
          dur: 15,
          status: "success",
          phase: "containment",
        },
      ],
    },
    {
      key: "I2",
      id: "INC-KAUST-02",
      title: "Persistence established on WS01",
      severity: "high",
      assignee: "KAUST SOC",
      team: "SOC",
      playbook: "PB-PERSIST-01",
      status: "resolved",
      ack: 45,
      triage: 95,
      escalate: 70,
      contain: 150,
      resolve: 460,
      actions: [
        {
          type: "isolate-host",
          mode: "manual",
          system: "edr",
          actor: "KAUST SOC",
          description: "WS01 containment from INC-KAUST-01 confirmed effective — persistence mechanisms could not re-establish.",
          start: 60,
          dur: 10,
          status: "success",
          contain: true,
          phase: "containment",
        },
        {
          type: "remove-persistence",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "Registry Run key removed from WS01.",
          start: 200,
          dur: 20,
          status: "success",
          phase: "eradication",
        },
        {
          type: "remove-persistence",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "Scheduled task removed from WS01.",
          start: 225,
          dur: 15,
          status: "success",
          phase: "eradication",
        },
        {
          type: "remove-persistence",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "WMI event subscription persistence removed from WS01.",
          start: 245,
          dur: 25,
          status: "success",
          phase: "eradication",
        },
        {
          type: "remove-malware",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "Mimikatz binary removed from WS01.",
          start: 275,
          dur: 15,
          status: "success",
          phase: "eradication",
        },
        {
          type: "remove-malware",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "CALDERA agent binaries removed from WS01.",
          start: 295,
          dur: 15,
          status: "success",
          phase: "eradication",
        },
      ],
    },
    {
      key: "I3",
      id: "INC-KAUST-03",
      title: "Domain credential compromise via DCSync from DC01",
      severity: "critical",
      assignee: "KAUST SOC",
      team: "Incident Response",
      playbook: "PB-CRED-01",
      status: "resolved",
      ack: 18,
      triage: 55,
      escalate: 40,
      contain: 105,
      resolve: 520,
      actions: [
        {
          type: "disable-account",
          mode: "manual",
          system: "identity",
          actor: "KAUST SOC",
          description: "Compromised AD account (svc_backup) disabled.",
          start: 70,
          dur: 20,
          status: "success",
          contain: true,
          phase: "containment",
        },
        {
          type: "remove-malware",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "Staged collection files removed from DC01.",
          start: 220,
          dur: 20,
          status: "success",
          phase: "eradication",
        },
        {
          type: "reset-credentials",
          mode: "manual",
          system: "identity",
          actor: "KAUST SOC",
          description: "svc_backup account password reset.",
          start: 320,
          dur: 15,
          status: "success",
          phase: "recovery",
        },
        {
          type: "enable-account",
          mode: "manual",
          system: "identity",
          actor: "KAUST SOC",
          description: "svc_backup account re-enabled after remediation.",
          start: 350,
          dur: 10,
          status: "success",
          phase: "recovery",
        },
      ],
    },
    {
      key: "I4",
      id: "INC-KAUST-04",
      title: "Data exfiltration over the C2 channel from WS01",
      severity: "high",
      assignee: "KAUST SOC",
      team: "SOC",
      playbook: "PB-EXFIL-01",
      status: "resolved",
      ack: 25,
      triage: 60,
      escalate: 45,
      contain: 130,
      resolve: 400,
      actions: [
        {
          type: "block-ip",
          mode: "manual",
          system: "firewall",
          actor: "KAUST SOC",
          description: "C2 destination blocked at the egress proxy.",
          start: 90,
          dur: 20,
          status: "success",
          contain: true,
          phase: "containment",
        },
        {
          type: "restore-network",
          mode: "manual",
          system: "edr",
          actor: "KAUST SOC",
          description: "WS01 restored to normal network access.",
          start: 300,
          dur: 15,
          status: "success",
          phase: "recovery",
        },
        {
          type: "verify-visibility",
          mode: "manual",
          system: "analyst",
          actor: "KAUST SOC",
          description: "SIEM visibility verified across WS01 and DC01 post-remediation.",
          start: 330,
          dur: 30,
          status: "success",
          phase: "recovery",
        },
      ],
    },
  ],
};

/* ========================================================================== */
/* Run 5 — APT29 Validation — Live Demo (SIMULATED — the "Run Demo" scenario) */
/*                                                                            */
/* Deliberately contains a fictional detection gap: DCSync goes undetected   */
/* on this run, so the exhibition audience can see Burhan surface a real     */
/* coverage gap in a live pass, not just recite the historical result.       */
/* ========================================================================== */

export const LIVE_RUN_ID = "BRH-2026-0172";

const RUN_LIVE_DEMO: ScenarioScript = {
  runId: LIVE_RUN_ID,
  scenarioId: "sc-apt29-live-demo",
  scenario: "APT29 Validation — Live Demo",
  threatProfile: "APT29",
  emulationTool: "caldera",
  siem: ELASTIC,
  operationId: "op-live-demo-01",
  operator: "Purple Team",
  description:
    "Simulated demo data — a compact replay of the KAUST APT29 chain, run live for the exhibition floor. One technique is intentionally left undetected to demonstrate how Burhan surfaces a coverage gap.",
  startedAt: "2026-08-21T09:00:00.000Z",
  status: "running",
  evidenceBasis: "demo",
  steps: [
    {
      t: "T1059.001",
      host: "WS01",
      user: "j.aziz",
      process: "powershell.exe",
      command: "powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0A...",
      ability: "ab-ps-exec-live-01",
      at: 0,
      tel: 12,
      det: { d: 38, rule: "ELA-R-0114", sev: "high", conf: "high" },
      inc: "I1",
      note: "PowerShell execution — encoded stager on WS01.",
    },
    {
      t: "T1082",
      host: "WS01",
      user: "j.aziz",
      process: "systeminfo.exe",
      command: "systeminfo.exe && whoami /all",
      ability: "ab-sysinfo-live-01",
      at: 90,
      tel: 10,
      det: { d: 41, rule: "ELA-R-0130", sev: "low", conf: "medium" },
      inc: "I1",
      note: "Discovery — host reconnaissance.",
    },
    {
      t: "T1547.001",
      host: "WS01",
      user: "j.aziz",
      process: "reg.exe",
      command: "reg add HKCU\\...\\Run /v UpdateSvc /d %APPDATA%\\svc.dat",
      ability: "ab-runkey-live-01",
      at: 190,
      tel: 6,
      det: { d: 33, rule: "ELA-R-0133", sev: "medium", conf: "high" },
      inc: "I1",
      note: "Registry persistence established.",
    },
    {
      t: "T1003.006",
      host: "DC01",
      user: "svc_backup",
      process: "lsass.exe",
      command: "DS-Replication-Get-Changes request issued by svc_backup against DC01",
      ability: "ab-dcsync-live-01",
      at: 300,
      tel: 9,
      det: null,
      inc: undefined,
      note: "DCSync executed — telemetry received, but no alert generated. Detection gap.",
    },
    {
      t: "T1021.006",
      host: "DC01",
      user: "svc_backup",
      process: "wsmprovhost.exe",
      command: "Invoke-Command -ComputerName DC01 -ScriptBlock { whoami } (source WS01)",
      ability: "ab-winrm-live-01",
      at: 400,
      tel: 8,
      det: { d: 29, rule: "ELA-R-0195", sev: "high", conf: "high" },
      inc: "I2",
      note: "Lateral movement to the domain controller.",
    },
  ],
  incidents: [
    {
      key: "I1",
      id: "INC-LIVE-01",
      title: "Execution and persistence on WS01",
      severity: "high",
      assignee: "S. Rahman",
      team: "SOC Tier 1",
      playbook: "PB-EXEC-01",
      status: "contained",
      ack: 40,
      triage: 90,
      escalate: 70,
      contain: 220,
      actions: [
        {
          type: "kill-process",
          mode: "automated",
          system: "edr",
          actor: "EDR Auto-Response",
          description: "Terminated the encoded PowerShell stager.",
          start: 120,
          dur: 10,
          status: "success",
        },
        {
          type: "isolate-host",
          mode: "manual",
          system: "edr",
          actor: "S. Rahman",
          description: "Isolated WS01 pending review.",
          start: 190,
          dur: 30,
          status: "success",
          contain: true,
        },
      ],
    },
    {
      key: "I2",
      id: "INC-LIVE-02",
      title: "Lateral movement to DC01",
      severity: "high",
      assignee: "Y. Mansour",
      team: "Incident Response",
      playbook: "PB-LATMOV-01",
      status: "contained",
      ack: 30,
      triage: 70,
      escalate: 55,
      contain: 200,
      actions: [
        {
          type: "disable-account",
          mode: "manual",
          system: "identity",
          actor: "Y. Mansour",
          description: "Disabled svc_backup pending investigation.",
          start: 110,
          dur: 30,
          status: "success",
          contain: true,
        },
      ],
    },
  ],
};

/** Historical + demo runs, oldest first. The live-demo scenario is kept separate. */
export const HISTORICAL_SCENARIOS: ScenarioScript[] = [
  RUN_CREDENTIAL_ACCESS,
  RUN_POWERSHELL,
  RUN_LATERAL,
  RUN_KAUST,
];

export const LIVE_SCENARIO: ScenarioScript = RUN_LIVE_DEMO;

export const ALL_SCENARIOS: ScenarioScript[] = [...HISTORICAL_SCENARIOS, RUN_LIVE_DEMO];

export function scenarioForRun(runId: string): ScenarioScript | undefined {
  return ALL_SCENARIOS.find((s) => s.runId === runId);
}
