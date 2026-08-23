# Elastic Detection Rules

This directory contains the 16 Elastic Security detection rules documented in the project's final report.

## Important

These YAML files are **documentation/source files**, not direct Elastic Security export bundles.  
They preserve the rule name, query language, query, ATT&CK mapping, risk score, schedule, description, and known false-positive notes from Appendix B of the final report.

All rules use:

- Execution interval: `1m`
- Look-back window: `5m`

## Rule Index

| # | Rule | Language | Risk |
|---|---|---|---:|
| 1 | [APT29 - Phishing via HTA and Mshta Proxy Execution](01-phishing-hta-mshta-powershell.yml) | KQL | 99 |
| 2 | [APT29 - Obfuscated PowerShell Execution](02-obfuscated-powershell.yml) | KQL | 73 |
| 3 | [APT29 - PowerShell Script Block Suspicious Content](03-powershell-scriptblock-suspicious-content.yml) | KQL | 73 |
| 4 | [APT29 - Process Execution from Suspicious Directory](04-suspicious-directory-execution.yml) | KQL | 47 |
| 5 | [APT29 - Honeypot Account Access Detected](05-honeypot-account-access.yml) | KQL | 99 |
| 6 | [APT29 - Registry Run Key Persistence](06-registry-run-key-persistence.yml) | KQL | 77 |
| 7 | [APT29 - Mimikatz Process Execution](07-mimikatz-process-execution.yml) | KQL | 99 |
| 8 | [APT29 - PowerShell Suspicious Network Outbound](08-powershell-suspicious-network-outbound.yml) | KQL | 99 |
| 9 | [APT29 - Data Exfiltration Over C2 Channel](09-data-exfiltration-over-c2.yml) | KQL | 99 |
| 10 | [APT29 - Scheduled Task Persistence](10-scheduled-task-persistence.yml) | KQL | 73 |
| 11 | [APT29 - DCSync Credential Dumping](11-dcsync-credential-dumping.yml) | KQL | 99 |
| 12 | [APT29 - Explicit Credential Object Creation](12-explicit-credential-object-creation.yml) | KQL | 73 |
| 13 | [APT29 - Lateral Movement via WinRM](13-lateral-movement-winrm.yml) | KQL | 73 |
| 14 | [APT29 - File Collection via PowerShell](14-file-collection-powershell.yml) | KQL | 50 |
| 15 | [APT29 - WMI Event Subscription Persistence](15-wmi-event-subscription-persistence.yml) | EQL | 99 |
| 16 | [APT29 - System and AD Discovery](16-system-ad-discovery.yml) | KQL | 47 |

## Validation Method

Each detection rule was validated by executing the corresponding CALDERA ability and confirming that Elastic Security generated the expected alert. Rules were then tuned against observed false positives before being accepted into the final rule set.

## Coverage

The final validated attack-chain run achieved:

- 16 detection rules
- 39 Elastic Security alerts
- 11/11 selected ATT&CK techniques detected
- 100% coverage within the project's selected emulation scope
