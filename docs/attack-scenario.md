# APT29 Attack Scenario and CALDERA Operation

## Overview

This project emulates selected Living-off-the-Land (LOTL) behaviors associated with APT29 (also known as Cozy Bear or Midnight Blizzard) inside an isolated Active Directory lab environment.

The objective of the attack scenario is not to reproduce malicious activity against a real environment, but to safely simulate realistic adversary behaviors so that detection rules, threat-hunting queries, and incident-response procedures can be evaluated.

MITRE CALDERA was used as the adversary-emulation platform to execute the attack techniques against the lab endpoints. Each technique was mapped to the MITRE ATT&CK framework and validated individually before being included in the final attack chain.

---

## Lab Environment

The attack scenario was executed in an isolated Active Directory environment consisting of:

| Host        | Role                                                   |
| ----------- | ------------------------------------------------------ |
| `CALDERA01` | MITRE CALDERA adversary-emulation and C2 server        |
| `ELASTIC01` | Elastic Security SIEM, Fleet, and Kibana               |
| `DC01`      | Windows Server 2022 Active Directory Domain Controller |
| `WS01`      | Standard employee Windows 10 workstation               |
| `WS02`      | Privileged/IT Windows 10 workstation                   |

All systems were connected through the same isolated lab network.

CALDERA Sandcat agents were deployed on WS01, WS02, and DC01 to allow controlled execution of the selected ATT&CK techniques.

---

## Attack Scenario

The scenario represents an attacker gaining initial access to an employee workstation and progressively performing execution, discovery, persistence, credential access, lateral movement, collection, and exfiltration activities.

The attack was designed around native Windows utilities and PowerShell wherever possible to represent Living-off-the-Land behavior.

### Attack Flow

```text
Initial Access
      |
      v
HTA / mshta.exe
      |
      v
PowerShell Execution
      |
      v
System & Domain Discovery
      |
      v
Persistence
 |             |
 v             v
Registry     Scheduled
Run Key       Task
      |
      v
Credential Access
   (DCSync)
      |
      v
Lateral Movement
   (WinRM)
      |
      v
WS02 Persistence
(WMI Subscription)
      |
      v
Collection
      |
      v
C2 Exfiltration
```

---

## MITRE ATT&CK Attack Chain

| Phase             | Technique                                 | ATT&CK ID     |
| ----------------- | ----------------------------------------- | ------------- |
| Initial Access    | Spearphishing Attachment / HTA delivery   | T1566.001     |
| Defense Evasion   | Signed Binary Proxy Execution: Mshta      | T1218.005     |
| Execution         | PowerShell                                | T1059.001     |
| Defense Evasion   | Obfuscated / Encoded Files or Information | T1027         |
| Discovery         | System and Domain Discovery               | T1082 / T1069 |
| Persistence       | Registry Run Keys / Startup Folder        | T1547.001     |
| Persistence       | Scheduled Task                            | T1053.005     |
| Credential Access | DCSync                                    | T1003.006     |
| Lateral Movement  | Windows Remote Management                 | T1021.006     |
| Persistence       | WMI Event Subscription                    | T1546.003     |
| Collection        | Automated Collection / Data Staging       | T1119         |
| Exfiltration      | Exfiltration Over C2 Channel              | T1041         |

---

# Attack Phases

## 1. Initial Access - HTA Spearphishing Simulation

The attack begins on `WS01`, representing a standard employee workstation.

A custom CALDERA ability named:

`Safe HTA Spearphishing Attachment Simulation`

was developed to simulate the execution behavior of a malicious email attachment.

The benign lab payload is delivered as:

```text
Invoice.hta
```

The file is executed using the legitimate Windows binary:

```text
mshta.exe
```

which subsequently launches PowerShell.

The resulting process relationship is approximately:

```text
Invoice.hta
    |
    v
mshta.exe
    |
    v
powershell.exe
```

This behavior was selected because `mshta.exe` is a legitimate Windows utility that can be abused by attackers as a Living-off-the-Land Binary (LOLBin).

The activity provides coverage for:

* T1566.001 - Spearphishing Attachment
* T1218.005 - Mshta
* T1059.001 - PowerShell

---

## 2. PowerShell Execution

After initial access, PowerShell commands are executed through CALDERA.

The scenario includes encoded or obfuscated PowerShell activity to reproduce behavior in which attackers attempt to make commands more difficult to inspect using simple signature-based detection.

Example behavioral characteristics include:

```text
powershell.exe
-EncodedCommand
ExecutionPolicy Bypass
Encoded or obfuscated command content
```

Relevant ATT&CK techniques:

* T1059.001 - PowerShell
* T1027 - Obfuscated/Compressed Files and Information

Detection focuses on behavior and command-line characteristics rather than treating all PowerShell usage as malicious.

---

## 3. System and Domain Discovery

After execution, the simulated adversary collects information about the compromised environment.

Discovery actions include commands and techniques such as:

```text
whoami
systeminfo
ipconfig
net user
net group /domain
```

These commands allow an attacker to understand:

* Current user context
* Host information
* Network configuration
* Available users
* Domain groups
* Privileged accounts

Discovery activity was executed primarily against `WS01`.

---

## 4. Persistence - Registry Run Key

The simulated attacker establishes persistence using a Windows Registry Run key.

Registry Run keys can cause configured programs or commands to execute when a user logs into Windows.

The activity is mapped to:

```text
T1547.001 - Registry Run Keys / Startup Folder
```

Elastic telemetry was used to identify suspicious registry modifications associated with this behavior.

---

## 5. Persistence - Scheduled Task

A second persistence mechanism is created using Windows Scheduled Tasks.

The scenario tests whether the SOC can detect suspicious scheduled-task creation rather than treating all scheduled tasks as malicious.

The activity is mapped to:

```text
T1053.005 - Scheduled Task/Job: Scheduled Task
```

This technique provides an additional persistence mechanism independent of the Registry Run key.

---

## 6. Credential Access - DCSync

The attack chain then performs a controlled DCSync simulation against:

```text
DC01
```

DCSync abuses Active Directory replication functionality to request credential information as if the requester were another domain controller.

In the lab scenario, the activity was used to test detection of access associated with the `krbtgt` account.

The activity is mapped to:

```text
T1003.006 - OS Credential Dumping: DCSync
```

A CALDERA agent was deployed to DC01 specifically to support controlled credential-access emulation.

---

## 7. Lateral Movement - WinRM

The scenario includes Windows Remote Management behavior associated with movement between Windows systems.

The relevant ATT&CK technique is:

```text
T1021.006 - Windows Remote Management
```

The purpose of this phase is to determine whether authentication and remote-management telemetry can identify suspicious movement between hosts.

The corresponding Elastic detection was later tuned to remove noise generated by machine accounts and anonymous logons.

---

## 8. Persistence on WS02 - WMI Event Subscription

After activity reaches the more privileged `WS02` workstation, CALDERA performs a WMI Event Subscription persistence simulation.

The activity is mapped to:

```text
T1546.003 - Event Triggered Execution: Windows Management Instrumentation Event Subscription
```

The scenario uses a `CommandLineEventConsumer` to reproduce the behavioral characteristics defenders would investigate when identifying malicious WMI persistence.

---

## 9. Data Collection

Dummy corporate information was intentionally created on `WS01` in:

```text
CompanyData
```

This provided a safe dataset for testing the Collection stage without using real sensitive information.

PowerShell was then used to discover and stage the files for later exfiltration.

The activity is mapped to:

```text
T1119 - Automated Collection
```

This phase was added after identifying a Collection coverage gap during development of the original attack chain.

---

## 10. C2 Data Exfiltration

After the dummy data is collected, the scenario simulates transmission of the staged information to the CALDERA C2 infrastructure.

The activity is mapped to:

```text
T1041 - Exfiltration Over C2 Channel
```

The objective is to evaluate whether endpoint and network telemetry can identify suspicious outbound activity associated with previously observed attack behavior.

No real organizational or personal data was used during the simulation.

---

# CALDERA Operation

## Adversary Profile Development

The original CALDERA adversary profile was named:

```text
APT29-FirstTry
```

The initial profile contained multiple abilities covering execution, discovery, persistence, and lateral movement.

During testing, several abilities failed because of command syntax differences and incompatibilities with the lab environment.

Instead of continuing to execute the complete profile with unreliable abilities, each technique was:

1. Executed individually.
2. Troubleshot when necessary.
3. Validated against the target host.
4. Checked against Elastic telemetry.
5. Added to the final chain only after successful validation.

This iterative process produced a more reliable final adversary profile.

---

# Final CALDERA Operation

The final reportable CALDERA operation used agents on three systems:

| Host | CALDERA Agent |
| ---- | ------------- |
| WS01 | `uamwqj`      |
| WS02 | `hahuqk`      |
| DC01 | `lajkar`      |

The final operation sequence was:

| Order | CALDERA Ability                                  | Tactic                           | Target |
| ----: | ------------------------------------------------ | -------------------------------- | ------ |
|     1 | Safe HTA Spearphishing Simulation                | Initial Access                   | WS01   |
|     2 | PowerShell Command Execution                     | Execution                        | WS01   |
|     3 | System Information Discovery                     | Discovery                        | WS01   |
|     4 | Elevated Group Enumeration (`net group /domain`) | Discovery                        | WS01   |
|     5 | Registry Run Key                                 | Persistence                      | WS01   |
|     6 | Scheduled Task                                   | Persistence                      | WS01   |
|     7 | Recon Information for Export with PowerShell     | Collection                       | WS01   |
|     8 | C2 Data Exfiltration                             | Exfiltration                     | WS01   |
|     9 | DCSync (Active Directory)                        | Credential Access                | DC01   |
|    10 | WMI Event Subscription                           | Persistence                      | WS02   |
|    11 | Honeypot Account Access - `svc-backup`           | Discovery / Deception Validation | WS01   |

---

## CALDERA Status Validation

During the final operation, CALDERA displayed the following two abilities as failed:

```text
Recon Information for Export with PowerShell
C2 Data Exfiltration
```

However, investigation of the individual ability output showed that the underlying PowerShell commands completed successfully.

The staged `CompanyData` contents were also independently confirmed to have reached the CALDERA C2 listener.

Therefore, the two abilities were treated as successfully executed based on execution evidence rather than the CALDERA summary-status field alone.

---

# Validation Approach

The attack chain followed a purple-team validation process:

```text
CALDERA Ability
      |
      v
Execute Technique
      |
      v
Generate Endpoint Telemetry
      |
      v
Elastic Security
      |
      v
Detection Rule
      |
      v
Alert Validation
      |
      v
Threat Hunting
      |
      v
Incident Response
```

A technique was not considered fully validated simply because CALDERA reported successful execution.

The team also confirmed that:

* Relevant telemetry reached Elastic Security.
* The expected detection rule generated an alert.
* The alert contained sufficient investigation context.
* Threat-hunting queries could locate the associated activity.

This approach allowed the red-team emulation and blue-team detection capabilities to be validated together.

---

# Final Result

The optimized attack scenario successfully exercised the selected APT29-inspired LOTL behaviors across the Active Directory environment.

The final validation produced:

```text
11 / 11 emulated techniques detected
100% attack-chain detection coverage
39 Elastic Security alerts
```

The results from the CALDERA operation were subsequently used as the basis for:

* Elastic detection-rule validation
* Threat hunting
* Incident-response investigation
* SOC performance measurements
* MITRE ATT&CK coverage evaluation

---

## Evidence

Screenshots supporting this scenario are stored under:

```text
../assets/attack-scenario/
```

Recommended evidence includes:

<img width="656" height="289" alt="image" src="https://github.com/user-attachments/assets/cadcee9e-d801-4d52-af45-d2ed8e3866ad" />

<img width="273" height="202" alt="image" src="https://github.com/user-attachments/assets/66102c92-461b-4963-ae97-5edb199a866f" />
*Custom CALDERA ability used to emulate HTA-based initial access through mshta.exe and PowerShell.*

### Final CALDERA Operation Evidence
<img width="719" height="242" alt="image" src="https://github.com/user-attachments/assets/b7658564-de12-44d9-ac1c-2918eacc25de" />
*Final validated CALDERA operation showing the execution of the attack chain against WS01.*

<img width="406" height="62" alt="image" src="https://github.com/user-attachments/assets/518eb1ad-c7dd-4d4d-b220-e693a8017add" />

<img width="406" height="53" alt="image" src="https://github.com/user-attachments/assets/46d8cc79-9e5d-4bbd-b1e4-3b7f9e87624e" />



