# Incident Timeline

This reproduces the chronological final CALDERA operation log documented in the report. Times are **UTC**.

| Time (UTC) | Ability | Tactic | Agent | Host | Result |
|---|---|---|---|---|---|
| 7:46:50 PM | Safe HTA Spearphishing Simulation | Initial Access | `uamwqj` | WS01 | Success |
| 7:48:32 PM | PowerShell Command Execution | Execution | `uamwqj` | WS01 | Success |
| 7:48:47 PM | System Information Discovery | Discovery | `uamwqj` | WS01 | Success |
| 7:49:47 PM | Elevated group enumeration (`net group /domain`) | Discovery | `uamwqj` | WS01 | Success |
| 7:50:42 PM | Reg Key Run | Persistence | `uamwqj` | WS01 | Success |
| 7:51:17 PM | Scheduled task (local) | Persistence | `uamwqj` | WS01 | Success |
| 7:52:22 PM | Recon information for export with PowerShell | Collection | `uamwqj` | WS01 | Success* |
| 7:53:12 PM | C2 Data Exfiltration | Exfiltration | `uamwqj` | WS01 | Success* |
| 7:56:31 PM | DCSync (Active Directory) | Credential Access | `lajkar` | DC01 | Success |
| 8:00:29 PM | WMI Event Subscription (`CommandLineEventConsumer`) | Persistence | `hahuqk` | WS02 | Success |
| 8:02:29 PM | Honeypot Account Access — `svc-backup` | Discovery | `uamwqj` | WS01 | Success |

\* CALDERA displayed failed summary statuses for Collection and C2 Exfiltration, but their individual output and C2 evidence confirmed successful execution.

Elastic alerts were sorted by `@timestamp` during triage and correlated against this attack-side timeline.

> The report does not provide a complete per-alert timestamp table for all 39 Elastic alerts, so no unsupported alert timestamps are added here.
