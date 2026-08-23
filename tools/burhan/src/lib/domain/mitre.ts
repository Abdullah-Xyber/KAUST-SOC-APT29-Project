import type { MitreTactic, MitreTechnique, TacticId } from "./types";

export const MITRE_TACTICS: MitreTactic[] = [
  { id: "initial-access", code: "TA0001", name: "Initial Access", order: 1 },
  { id: "execution", code: "TA0002", name: "Execution", order: 2 },
  { id: "persistence", code: "TA0003", name: "Persistence", order: 3 },
  { id: "privilege-escalation", code: "TA0004", name: "Privilege Escalation", order: 4 },
  { id: "defense-evasion", code: "TA0005", name: "Defense Evasion", order: 5 },
  { id: "credential-access", code: "TA0006", name: "Credential Access", order: 6 },
  { id: "discovery", code: "TA0007", name: "Discovery", order: 7 },
  { id: "lateral-movement", code: "TA0008", name: "Lateral Movement", order: 8 },
  { id: "collection", code: "TA0009", name: "Collection", order: 9 },
  { id: "command-and-control", code: "TA0011", name: "Command and Control", order: 10 },
  { id: "exfiltration", code: "TA0010", name: "Exfiltration", order: 11 },
  { id: "impact", code: "TA0040", name: "Impact", order: 12 },
];

export const TACTIC_BY_ID: Record<TacticId, MitreTactic> = MITRE_TACTICS.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<TacticId, MitreTactic>,
);

/**
 * The technique catalog for this demo — deliberately small. Every entry
 * below is either exercised by a validation run (most of them) or left
 * untested on purpose, so the MITRE Coverage page can show all four states:
 * Detected, Partially Detected, Missed, and Not Tested.
 */
export const MITRE_TECHNIQUES: MitreTechnique[] = [
  {
    id: "T1566.001",
    name: "Spearphishing Attachment",
    tactics: ["initial-access"],
    parentId: "T1566",
    description:
      "Adversaries send emails with a malicious attachment to gain execution on a victim endpoint.",
    platforms: ["Windows", "macOS", "Linux"],
    dataSources: ["Email Gateway", "File Creation", "Network Traffic"],
  },
  {
    id: "T1218.005",
    name: "Mshta",
    tactics: ["defense-evasion"],
    parentId: "T1218",
    description:
      "Adversaries proxy execution of malicious .hta payloads through the signed binary mshta.exe.",
    platforms: ["Windows"],
    dataSources: ["Process Creation", "Command Line"],
  },
  {
    id: "T1059.001",
    name: "PowerShell",
    tactics: ["execution"],
    parentId: "T1059",
    description:
      "Adversaries abuse PowerShell to execute commands, download payloads and run in-memory tooling.",
    platforms: ["Windows"],
    dataSources: ["Process Creation", "PowerShell Script Block Logging", "Module Logging"],
  },
  {
    id: "T1082",
    name: "System Information Discovery",
    tactics: ["discovery"],
    description:
      "Adversaries collect details about the operating system and hardware configuration of a host.",
    platforms: ["Windows", "Linux", "macOS"],
    dataSources: ["Process Creation", "Command Line"],
  },
  {
    id: "T1053.005",
    name: "Scheduled Task",
    tactics: ["execution", "persistence", "privilege-escalation"],
    parentId: "T1053",
    description:
      "Adversaries create scheduled tasks to execute payloads and survive reboots.",
    platforms: ["Windows"],
    dataSources: ["Process Creation", "Scheduled Job Creation", "Windows Event 4698"],
  },
  {
    id: "T1547.001",
    name: "Registry Run Keys / Startup Folder",
    tactics: ["persistence", "privilege-escalation"],
    parentId: "T1547",
    description:
      "Adversaries add a program to a Run key or Startup folder so it executes at logon.",
    platforms: ["Windows"],
    dataSources: ["Registry Modification", "File Creation"],
  },
  {
    id: "T1546.003",
    name: "Windows Management Instrumentation Event Subscription",
    tactics: ["persistence", "privilege-escalation"],
    parentId: "T1546",
    description:
      "Adversaries register a permanent WMI event subscription so a payload re-executes on a trigger condition.",
    platforms: ["Windows"],
    dataSources: ["WMI Activity Log", "Process Creation"],
  },
  {
    id: "T1055",
    name: "Process Injection",
    tactics: ["privilege-escalation", "defense-evasion"],
    description:
      "Adversaries inject code into live processes to evade defenses and elevate privileges.",
    platforms: ["Windows", "Linux"],
    dataSources: ["API Monitoring", "Process Access", "EDR Telemetry"],
  },
  {
    id: "T1562.001",
    name: "Disable or Modify Tools",
    tactics: ["defense-evasion"],
    parentId: "T1562",
    description:
      "Adversaries disable security tooling, such as AV or EDR sensors, to avoid detection.",
    platforms: ["Windows", "Linux"],
    dataSources: ["Service Modification", "Registry Modification", "EDR Telemetry"],
  },
  {
    id: "T1003.001",
    name: "LSASS Memory",
    tactics: ["credential-access"],
    parentId: "T1003",
    description:
      "Adversaries dump credential material from the LSASS process memory.",
    platforms: ["Windows"],
    dataSources: ["Process Access", "Sysmon Event 10", "EDR Telemetry"],
  },
  {
    id: "T1003",
    name: "OS Credential Dumping",
    tactics: ["credential-access"],
    description:
      "Adversaries dump credentials from the operating system to enable lateral movement.",
    platforms: ["Windows", "Linux"],
    dataSources: ["Process Access", "File Access", "EDR Telemetry"],
  },
  {
    id: "T1003.006",
    name: "DCSync",
    tactics: ["credential-access"],
    parentId: "T1003",
    description:
      "Adversaries abuse domain replication permissions to request credential material directly from a domain controller.",
    platforms: ["Windows"],
    dataSources: ["Windows Event 4662", "Directory Service Access Logs"],
  },
  {
    id: "T1087.002",
    name: "Domain Account Discovery",
    tactics: ["discovery"],
    parentId: "T1087",
    description: "Adversaries enumerate domain accounts to plan further activity.",
    platforms: ["Windows"],
    dataSources: ["Process Creation", "Command Line", "LDAP Query Logs"],
  },
  {
    id: "T1021.001",
    name: "Remote Desktop Protocol",
    tactics: ["lateral-movement"],
    parentId: "T1021",
    description: "Adversaries use RDP to move laterally to other systems.",
    platforms: ["Windows"],
    dataSources: ["Windows Event 4624", "Network Traffic", "Authentication Logs"],
  },
  {
    id: "T1021.006",
    name: "Windows Remote Management",
    tactics: ["lateral-movement"],
    parentId: "T1021",
    description: "Adversaries use WinRM to execute commands and move laterally to other hosts.",
    platforms: ["Windows"],
    dataSources: ["Process Creation", "Network Traffic", "WinRM Logs"],
  },
  {
    id: "T1119",
    name: "Automated Collection",
    tactics: ["collection"],
    description:
      "Adversaries use scripting or built-in tools to automatically gather sensitive files ahead of exfiltration.",
    platforms: ["Windows", "Linux", "macOS"],
    dataSources: ["File Access", "Process Creation"],
  },
  {
    id: "T1041",
    name: "Exfiltration Over C2 Channel",
    tactics: ["exfiltration"],
    description: "Adversaries steal data over the same channel used for command and control.",
    platforms: ["Windows", "Linux", "macOS"],
    dataSources: ["Network Traffic", "Web Proxy"],
  },
  {
    id: "T1136.001",
    name: "Create Local Account",
    tactics: ["persistence"],
    parentId: "T1136",
    description: "Adversaries create a local account to maintain access to a host. Not yet exercised.",
    platforms: ["Windows", "Linux"],
    dataSources: ["Windows Event 4720", "Authentication Logs"],
  },
  {
    id: "T1490",
    name: "Inhibit System Recovery",
    tactics: ["impact"],
    description:
      "Adversaries delete shadow copies and backups to prevent recovery after encryption. Not yet exercised.",
    platforms: ["Windows"],
    dataSources: ["Process Creation", "Command Line"],
  },
];

export const TECHNIQUE_BY_ID: Record<string, MitreTechnique> = MITRE_TECHNIQUES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<string, MitreTechnique>,
);

export function getTechnique(id: string): MitreTechnique | undefined {
  return TECHNIQUE_BY_ID[id];
}

export function techniqueName(id: string): string {
  return TECHNIQUE_BY_ID[id]?.name ?? id;
}

/** Primary tactic column a technique renders in on the matrix. */
export function primaryTactic(id: string): TacticId {
  return TECHNIQUE_BY_ID[id]?.tactics[0] ?? "execution";
}

export function techniquesForTactic(tactic: TacticId): MitreTechnique[] {
  return MITRE_TECHNIQUES.filter((t) => t.tactics.includes(tactic));
}
