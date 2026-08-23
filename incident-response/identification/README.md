# Incident Response — Identification

## Purpose
This directory documents the identification and triage phase of the simulated APT29 LOTL incident.

The investigation began in Elastic Security under **Security → Alerts**. Alerts were sorted by timestamp and reviewed by severity to reconstruct the intrusion sequence and determine affected hosts and identities.

## Confirmed Scope

| Item | Confirmed Finding |
|---|---|
| Primary compromised host | `WS01` |
| Compromised AD identity | `CORP\ws01` |
| Lateral-movement / persistence target | `WS02` |
| Credential-access target | `DC01` |
| Simulated C2 | `CALDERA01` (`172.20.10.20`) |
| SIEM | `ELASTIC01` |

A key triage finding was that the compromised account was **`ws01`**, not `labuserv1` as assumed earlier in the project documentation. This was corrected before containment.

## Evidence
- [`incident-timeline.md`](incident-timeline.md) — chronological CALDERA attack-side reference.
- [`alert-summary.md`](alert-summary.md) — final Elastic alert evidence.
- [`investigation-notes.md`](investigation-notes.md) — triage conclusions and analyst pivots.
- [`evidence/README.md`](evidence/README.md) — evidence index.

## Outcome
The final attack-chain execution generated **39 Elastic Security alerts** with **11/11 selected techniques detected**. Identification confirmed `WS01` as the primary compromised host and `CORP\ws01` as the compromised identity before containment.
