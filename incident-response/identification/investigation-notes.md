# Investigation Notes

## Compromised Identity
Triage confirmed the compromised Active Directory identity as:

```text
CORP\ws01
```

This corrected the earlier assumption that the account was `labuserv1` before containment began.

## Host Findings
- **WS01:** primary compromised host; initial access, execution, discovery, persistence, collection, C2 exfiltration, and honeypot-account activity.
- **DC01:** controlled DCSync credential-access activity.
- **WS02:** WMI Event Subscription persistence and lateral-movement validation target.

## Useful Investigation Pivots

```kql
event.code:"1" and process.parent.name:"splunkd.exe"
```

```kql
event.code:"4662" and winlog.event_data.Properties:(*1131f6aa* or *1131f6ad*)
```

The report found the Sandcat `splunkd.exe` parent-process footprint particularly useful for reconstructing attack-chain activity independently of the automated alert feed.

## Identification Evidence

![Compromised Account Identification](../../diagrams/incident-response/identification-compromised-account.png)
