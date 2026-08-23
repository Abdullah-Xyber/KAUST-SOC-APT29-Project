# Threat-Hunting Queries

This directory contains the six threat-hunting queries documented in the final APT29 LOTL project report.

## Important

The final report documents these threat hunts as **KQL queries executed in Kibana Discover**.  
No separate ES|QL threat-hunting queries are documented in the report, so this folder intentionally preserves only the source-supported KQL hunts rather than inventing additional ES|QL content.

## Query Index

| Hunt | Investigation Focus | Target Telemetry | File |
|---|---|---|---|
| H1 | CALDERA Child Processes | Sysmon Event 1 | [H1-caldera-child-processes.kql](H1-caldera-child-processes.kql) |
| H2 | Registry Persistence | Sysmon Event 13 | [H2-registry-persistence.kql](H2-registry-persistence.kql) |
| H3 | Scheduled Task Persistence | Security Event 4698 / Sysmon Event 1 | [H3-scheduled-task-persistence.kql](H3-scheduled-task-persistence.kql) |
| H4 | WMI Persistence | Sysmon Events 19, 20, 21 | [H4-wmi-persistence.kql](H4-wmi-persistence.kql) |
| H5 | Command-and-Control Communications | Sysmon Event 3 | [H5-c2-communications.kql](H5-c2-communications.kql) |
| H6 | DCSync Replication | Security Event 4662 (DC01) | [H6-dcsync-replication.kql](H6-dcsync-replication.kql) |

## Hunting Methodology

After the final attack-chain execution, the team performed six targeted threat hunts in Kibana Discover. The goal was to correlate endpoint, identity, persistence, and network activity into a single attack timeline without relying only on the automated Elastic Security alert feed.

The hunts covered:

- CALDERA child-process activity
- Registry persistence
- Scheduled-task persistence
- WMI persistence
- C2 communications
- DCSync replication activity

Hunt H1 was especially useful because the CALDERA Sandcat process (`splunkd.exe`) provided a reliable parent-process pivot for reconstructing complete attack-chain activity.
