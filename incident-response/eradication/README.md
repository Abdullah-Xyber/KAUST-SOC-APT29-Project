# Incident Response — Eradication

## Purpose

This directory documents the eradication phase of the simulated APT29 LOTL incident.

Eradication began only after containment had been verified. The objective was to remove the persistence mechanisms, offensive tooling, CALDERA agent binaries, and collection artifacts identified during investigation.

## Affected Hosts and Artifacts

| Host | Artifact | Eradication Action |
|---|---|---|
| `WS01` | Registry Run-key persistence | Remove the `Atomic Red Team` Run-key value |
| `WS01` | Scheduled task `spawn` | Unregister the scheduled task |
| `WS01` | Collection staging files | Remove `%TEMP%\T1119_*.txt` |
| `WS02` | WMI Event Subscription | Remove binding, consumer, and filter |
| `DC01` | Mimikatz toolkit | Remove `%TEMP%\mimikatz` |
| `WS01`, `WS02`, `DC01` | CALDERA Sandcat binary | Remove `C:\Users\Public\splunkd.exe` |

## Procedure

The complete command-by-command procedure is documented in:

- [`eradication-procedures.md`](eradication-procedures.md)
- [`verification-checklist.md`](verification-checklist.md)
- [`evidence/README.md`](evidence/README.md)

## Eradication Order

```text
WS01 Registry Persistence
          |
          v
WS01 Scheduled Task
          |
          v
WS02 WMI Subscription
          |
          v
DC01 Mimikatz
          |
          v
CALDERA Agents
          |
          v
WS01 Collection Staging Files
          |
          v
Verification
```

## Outcome

The documented verification checks confirmed removal of the identified persistence mechanisms, Mimikatz directory, CALDERA agent binaries, and collection staging files before recovery activities were performed.
