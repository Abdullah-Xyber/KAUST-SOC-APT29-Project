# Incident Response

## Overview

A complete incident-response exercise was performed against the simulated APT29 Living-off-the-Land intrusion.

The response process followed the incident-handling lifecycle used in **NIST SP 800-61 Rev. 2** and covered:

1. Identification and Triage
2. Containment
3. Eradication
4. Recovery
5. Post-Incident Review and Lessons Learned

The objective was to move beyond simply detecting the CALDERA attack and demonstrate how a SOC analyst could investigate, contain, remove, and recover from the simulated intrusion.

---

# Incident Scope

The investigation involved the following systems:

| Host        | Role                               | Incident Relevance                          |
| ----------- | ---------------------------------- | ------------------------------------------- |
| `WS01`      | Employee workstation               | Primary compromised host                    |
| `WS02`      | Privileged / IT workstation        | Lateral-movement and WMI persistence target |
| `DC01`      | Active Directory Domain Controller | DCSync / credential-access target           |
| `CALDERA01` | Adversary-emulation server         | Simulated C2 infrastructure                 |
| `ELASTIC01` | Elastic Security SIEM              | Detection and investigation platform        |

Key adversary artifacts identified during the investigation included:

| Artifact                 | Location                           | Host             |
| ------------------------ | ---------------------------------- | ---------------- |
| CALDERA Sandcat agent    | `C:\Users\Public\splunkd.exe`      | WS01, WS02, DC01 |
| Mimikatz                 | `%TEMP%\mimikatz\x64\mimikatz.exe` | DC01             |
| Registry Run key         | `HKCU:\...\CurrentVersion\Run`     | WS01             |
| Scheduled task           | `spawn`                            | WS01             |
| WMI subscription         | `root\subscription`                | WS02             |
| Collection staging files | `%TEMP%\T1119_*.txt`               | WS01             |
| Honeypot account         | `svc-backup`                       | DC01             |
| Compromised account      | `CORP\ws01`                        | Active Directory |

---

# 1. Identification and Triage

The response process began in Elastic Security.

Analysts reviewed:

```text
Kibana
└── Security
    └── Alerts
```

Alerts were sorted chronologically using `@timestamp` to reconstruct the attack timeline.

For each alert, the investigation focused on:

* Alert severity
* Detection rule
* Host
* User
* Process
* Parent process
* Command line
* Network destination
* Associated ATT&CK technique

The investigation correlated Elastic alerts with CALDERA execution evidence and raw telemetry from Kibana Discover.

---

## Triage Priority

The following prioritization was used:

| Severity | Response                                       |
| -------- | ---------------------------------------------- |
| Critical | Immediate escalation and containment           |
| High     | Investigate and correlate with adjacent alerts |
| Medium   | Investigate and validate for false positives   |

Known benign processes identified during previous detection tuning were considered before dismissing suspicious-directory alerts.

Examples included:

```text
OneDrive.exe
OneDriveStandaloneUpdater.exe
FileCoAuth.exe
DismHost.exe
```

Any unexpected process executing from locations such as:

```text
AppData
Windows\Temp
Users\Public
```

was treated as suspicious until validated.

---

## Compromised Identity Validation

During triage, an important discrepancy was identified.

The compromised Active Directory account had previously been assumed to be:

```text
labuserv1
```

Investigation of the actual telemetry confirmed that the compromised identity was:

```text
CORP\ws01
```

This was corrected before containment actions were performed.

![Compromised Account Identification](../diagrams/incident-response/identification-compromised-account.png)

*Investigation evidence confirming that the compromised Active Directory identity was ws01.*

---

# 2. Containment

Once the compromised host and identity were confirmed, containment was performed to prevent additional attacker activity.

The primary containment objectives were:

```text
Isolate compromised host
        |
        v
Terminate adversary access
        |
        v
Disable compromised identity
```

---

## Isolate WS01

`WS01` was identified as the primary compromised workstation.

Its Ethernet adapter was disabled:

```powershell
Disable-NetAdapter -Name "Ethernet" -Confirm:$false
```

Verification:

```powershell
Get-NetAdapter | Select-Object Name, Status
```

Expected result:

```text
Status: Disabled
```

---

## Stop the CALDERA Agent

The CALDERA Sandcat agent had been staged as:

```text
C:\Users\Public\splunkd.exe
```

The process was terminated using:

```powershell
Get-Process splunkd -ErrorAction SilentlyContinue | Stop-Process -Force
```

This removed the active CALDERA control channel from the compromised system.

---

## Disable the Compromised Account

The compromised `ws01` Active Directory account was disabled:

```powershell
Disable-ADAccount -Identity "ws01"
```

Verification:

```powershell
Get-ADUser ws01 | Select-Object Name, Enabled
```

Expected result:

```text
Enabled: False
```

---

## Containment Evidence

![WS01 Containment](../diagrams/incident-response/containment-ws01.png)

*WS01 isolated from the network and the CALDERA agent process terminated.*

---

## Containment Checklist

* [x] WS01 network adapter disabled
* [x] CALDERA agent stopped on WS01
* [x] CALDERA agent stopped on WS02
* [x] CALDERA agent stopped on DC01
* [x] Compromised account disabled in Active Directory

Containment was verified before proceeding to eradication.

---

# 3. Eradication

After containment, adversary artifacts were removed from each affected host.

The artifacts were removed in a controlled order and each removal was verified before proceeding.

---

## 3.1 Registry Run-Key Persistence — WS01

The malicious persistence value was removed from:

```text
HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
```

Removal:

```powershell
Remove-ItemProperty `
  -Path "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" `
  -Name "Atomic Red Team" `
  -Force
```

Verification:

```powershell
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
```

The `Atomic Red Team` entry should no longer appear.

---

## 3.2 Scheduled Task — WS01

The malicious scheduled task was removed:

```powershell
Unregister-ScheduledTask -TaskName "spawn" -Confirm:$false
```

Verification:

```powershell
Get-ScheduledTask -TaskName "spawn" -ErrorAction SilentlyContinue
```

No output indicates successful removal.

![WS01 Persistence Eradication](../diagrams/incident-response/eradication-ws01-persistence.png)

*Removal and verification of the Registry Run-key and Scheduled Task persistence mechanisms on WS01.*

---

## 3.3 WMI Event Subscription — WS02

The WMI persistence mechanism consisted of:

```text
__EventFilter
CommandLineEventConsumer
__FilterToConsumerBinding
```

The components were removed in the required order:

```text
Binding
   ↓
Consumer
   ↓
Filter
```

Commands:

```powershell
Get-CimInstance `
  -Namespace root/subscription `
  -ClassName __FilterToConsumerBinding |
Where-Object {
    $_.Filter.Name -like "*AtomicRedTeam*"
} |
Remove-CimInstance
```

```powershell
Get-CimInstance `
  -Namespace root/subscription `
  -ClassName CommandLineEventConsumer |
Where-Object {
    $_.Name -like "*AtomicRedTeam*"
} |
Remove-CimInstance
```

```powershell
Get-CimInstance `
  -Namespace root/subscription `
  -ClassName __EventFilter |
Where-Object {
    $_.Name -like "*AtomicRedTeam*"
} |
Remove-CimInstance
```

Verification:

```powershell
Get-CimInstance `
  -Namespace root/subscription `
  -ClassName __EventFilter
```

Post-removal verification confirmed that the adversary-created WMI subscription was no longer present.

---

## 3.4 Remove Mimikatz — DC01

The Mimikatz toolkit was removed from the Domain Controller:

```powershell
Remove-Item -Path "$env:TEMP\mimikatz" -Recurse -Force
```

Verification:

```powershell
Test-Path "$env:TEMP\mimikatz"
```

Expected result:

```text
False
```

![WMI and Mimikatz Eradication](../diagrams/incident-response/eradication-wmi-mimikatz.png)

*Removal and verification of WMI persistence on WS02 and the Mimikatz toolkit on DC01.*

---

## 3.5 Remove CALDERA Agent Binary

The Sandcat agent binary was removed from all affected hosts:

```powershell
Remove-Item "C:\Users\Public\splunkd.exe" `
  -Force `
  -ErrorAction SilentlyContinue
```

Verification:

```powershell
Test-Path "C:\Users\Public\splunkd.exe"
```

Expected result:

```text
False
```

This verification was performed on:

```text
WS01
WS02
DC01
```

![CALDERA Agent Eradication](../diagrams/incident-response/eradication-caldera-agents.png)

*Verification that the CALDERA agent binary was removed from WS01, WS02, and DC01.*

---

## 3.6 Remove Collection Staging Files — WS01

Files created during the Collection phase were removed:

```powershell
Remove-Item "$env:TEMP\T1119_*.txt" `
  -Force `
  -ErrorAction SilentlyContinue
```

Verification:

```powershell
Get-ChildItem "$env:TEMP" -Filter "T1119_*"
```

The command should return no matching files.

---

## Eradication Checklist

* [x] Registry Run key removed from WS01
* [x] Scheduled task removed from WS01
* [x] WMI Event Filter removed from WS02
* [x] WMI Event Consumer removed from WS02
* [x] WMI Filter-to-Consumer Binding removed from WS02
* [x] Mimikatz directory removed from DC01
* [x] CALDERA agent binary removed from WS01
* [x] CALDERA agent binary removed from WS02
* [x] CALDERA agent binary removed from DC01
* [x] Collection staging files removed from WS01

---

# 4. Recovery

After eradication was verified, normal operation was restored.

Recovery included:

```text
Reset credentials
      |
      v
Re-enable account
      |
      v
Restore network
      |
      v
Verify SIEM visibility
```

---

## Reset Compromised Credentials

The password for the compromised `ws01` account was reset.

The account was configured to require another password change at the next logon and was then re-enabled.

```powershell
Set-ADAccountPassword -Identity "ws01" -Reset `
  -NewPassword (ConvertTo-SecureString "<NEW_SECURE_PASSWORD>" -AsPlainText -Force)

Set-ADUser ws01 -ChangePasswordAtLogon $true

Enable-ADAccount -Identity "ws01"
```

> The repository intentionally uses a placeholder rather than documenting the lab password.

Verification:

```powershell
Get-ADUser ws01 | Select-Object Name, Enabled
```

Expected result:

```text
Enabled: True
```

---

## krbtgt Recovery Consideration

The DCSync simulation successfully extracted credential material associated with `krbtgt`.

However, a Golden Ticket was **not forged** during the project.

The incident-response playbook therefore documents the double `krbtgt` password-reset procedure as a recovery procedure to rehearse rather than an action required because of an observed forged ticket.

The playbook specifies two resets with a minimum interval of 72 hours.

---

## Restore WS01 Network Connectivity

After the host was confirmed clean:

```powershell
Enable-NetAdapter -Name "Ethernet" -Confirm:$false
```

Verification:

```powershell
Get-NetAdapter | Select-Object Name, Status
```

Expected status:

```text
Up
```

---

## Verify SIEM Visibility

After restoring the endpoint, Elastic telemetry was checked again.

Example searches:

```kql
event.code: "1" and host.name: "ws01"
```

```kql
event.code: "1" and host.name: "ws02"
```

```kql
event.code: "1" and host.name: "dc01"
```

The objective was to confirm that the hosts returned to normal operation without losing SOC visibility.

---

## Recovery Evidence

![Incident Recovery](../diagrams/incident-response/recovery-ws01.png)

*WS01 network connectivity restored and the compromised account reset and re-enabled.*

---

## Recovery Checklist

* [x] Compromised account password reset
* [x] Password change at next logon enforced
* [x] Compromised account re-enabled
* [x] WS01 network adapter restored
* [x] SIEM visibility verified
* [x] Detection rules confirmed active

The `krbtgt` double-reset procedure remained a documented recovery rehearsal because no Golden Ticket was forged during the exercise.

---

# 5. Lessons Learned

The incident-response exercise produced several important operational lessons.

## Behavioral Context Is Critical

Living-off-the-Land activity cannot reliably be identified by executable name alone.

Legitimate tools such as:

```text
mshta.exe
powershell.exe
net.exe
schtasks.exe
reg.exe
```

can also be abused by adversaries.

Detection therefore needs context such as:

* Parent-child process relationships
* Command-line arguments
* Registry paths
* Authentication behavior
* Network destinations

---

## PowerShell Script Block Logging Provides High-Value Evidence

PowerShell Script Block Logging provided decoded PowerShell content even when commands were encoded.

This gave the investigation visibility beyond normal process-creation telemetry and was especially valuable for PowerShell-based lateral movement and persistence.

---

## Audit Configuration Must Be Validated

DCSync detection required Security Event ID `4662`.

This telemetry was not available until the required Directory Service Access auditing was enabled on `DC01`.

A correctly written detection rule is ineffective when the required telemetry is not being collected.

---

## Detection Rules Must Be Tested Empirically

During the project, the expected PowerShell field:

```text
winlog.event_data.ScriptBlockText
```

did not match the actual Elastic field:

```text
powershell.file.script_block_text
```

The issue demonstrated why every detection should be tested against known activity instead of assuming that the rule will work based only on documentation.

---

## False Positives Require Environment-Specific Tuning

Legitimate Windows and Microsoft processes generated behavior similar to the simulated attack.

Examples included:

```text
OneDriveSetup.exe
OneDriveStandaloneUpdater.exe
FileCoAuth.exe
DismHost.exe
```

These cases required analyst investigation before appropriate exclusions could be added.

---

## Defense in Depth Improves Detection Resilience

Several phases of the attack were visible through multiple independent detection rules.

This means that failure or evasion of one detection mechanism would not necessarily result in complete loss of visibility.

Layered telemetry and behavioral detections therefore provided greater resilience across the attack chain.

---

# Incident Response Outcome

The exercise demonstrated a complete defensive workflow:

```text
APT29 Emulation
      |
      v
Elastic Detection
      |
      v
Identification & Triage
      |
      v
Containment
      |
      v
Eradication
      |
      v
Recovery
      |
      v
Post-Incident Review
```

The incident-response process successfully connected the project's adversary-emulation, detection-engineering, and threat-hunting work into a repeatable SOC response workflow.

