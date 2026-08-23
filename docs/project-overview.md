# 📌 Project Overview

## Project Title

**APT29 Adversary Emulation and Threat Detection in a SOC Laboratory**

---

## Overview

This project demonstrates an end-to-end **Security Operations Center (SOC) workflow** by emulating selected APT29 tactics, techniques, and procedures in an isolated and authorized virtual environment.

**MITRE CALDERA** was used to execute the adversary-emulation scenario, while **Elastic Security** collected endpoint telemetry, generated alerts, supported threat hunting, and assisted with incident investigation.

The project connected adversary emulation with defensive security operations to evaluate whether simulated malicious activity could be successfully observed, detected, investigated, and remediated.

> [!IMPORTANT]
> All activities were performed in a controlled laboratory for cybersecurity education and authorized security research.

---

## Project Motivation

Modern threat actors commonly use legitimate administrative tools and built-in operating-system components to avoid detection. This approach is known as **Living off the Land (LotL)**.

APT29 was selected because its documented behavior includes:

- PowerShell execution
- Credential and account discovery
- System and network discovery
- Persistence techniques
- Remote execution
- Lateral movement
- Use of legitimate Windows utilities
- Obfuscated commands and scripts

These behaviors made APT29 suitable for testing Windows monitoring, detection engineering, and threat-hunting capabilities.

---

## Project Objectives

The project aimed to:

- Build an isolated and functional SOC laboratory
- Configure a Windows Active Directory environment
- Join Windows workstations to the project domain
- Deploy Elastic Agent using Fleet
- Enable Windows auditing and PowerShell logging
- Collect centralized endpoint telemetry
- Develop an APT29 attack profile in MITRE CALDERA
- Execute selected MITRE ATT&CK techniques
- Create custom detection rules in Elastic Security
- Develop KQL and ES|QL threat-hunting queries
- Investigate alerts and suspicious endpoint activity
- Map emulated activities and detections to MITRE ATT&CK
- Apply incident-response procedures
- Measure detection and validation performance
- Identify technical challenges and areas for improvement

---

## Project Scope

The project focused on adversary emulation and defensive monitoring inside a controlled Windows domain.

### Included

- Active Directory and DNS configuration
- Windows endpoint monitoring
- PowerShell and Sysmon logging
- Elastic Agent deployment and Fleet management
- CALDERA agent deployment
- APT29 technique emulation
- Custom detection-rule development
- Threat hunting and alert investigation
- MITRE ATT&CK mapping
- Incident-response activities
- Security validation metrics
- Documentation of results and challenges

### Excluded

- Testing against production systems
- Unauthorised access to external systems
- Deployment of active malware
- Destructive attack techniques
- Automated remediation in production
- Collection of real organisational data
- Public disclosure of passwords, tokens, or sensitive network details

---

## Laboratory Environment

The environment contained the following systems:

| System | Operating System | Purpose |
|:---|:---|:---|
| **DC01** | Windows Server 2022 | Active Directory, DNS, authentication, and auditing |
| **WS01** | Windows 10 | Domain-connected workstation and emulation target |
| **WS02** | Windows 10 | Domain-connected workstation and emulation target |
| **ES01** | Ubuntu Server | Elastic Stack, Fleet, detection, and investigation |
| **CALDERA01** | Ubuntu Server | APT29 adversary-emulation platform |

The Windows systems operated inside the `corp.local` domain. **CALDERA01** and **ES01** were not joined to the Windows domain.

➡️ [View the complete architecture documentation](architecture.md)

---

## Project Methodology

The project followed a structured workflow:

1. Designed the isolated virtual laboratory.
2. Configured the internal network.
3. Deployed Active Directory Domain Services and DNS.
4. Joined the Windows workstations to the domain.
5. Enabled Windows auditing, PowerShell logging, and Sysmon.
6. Installed Elastic Agent on the monitored Windows hosts.
7. Connected the agents to Elastic Fleet.
8. Developed an APT29 attack profile in CALDERA.
9. Deployed CALDERA agents to the selected targets.
10. Executed selected ATT&CK techniques.
11. Collected and analysed the generated telemetry.
12. Created and tuned custom detection rules.
13. Performed threat hunting using KQL and ES|QL.
14. Investigated alerts and constructed an incident timeline.
15. Applied containment, eradication, and recovery procedures.
16. Calculated validation metrics and documented the results.

---

## Adversary Emulation

MITRE CALDERA was used to execute selected APT29 behaviors against authorised Windows targets.

The operation covered multiple attack stages, including:

- Initial access simulation
- Execution
- Persistence
- Discovery
- Credential and account-related activity
- Lateral movement
- Collection and exfiltration simulation

The complete operation was executed more than once. The final run was adjusted to improve telemetry collection, rule performance, and alert visibility.

➡️ [View the APT29 attack scenario](attack-scenario.md)

---

## Detection Engineering

Elastic Security was used to create and test custom rules for identifying suspicious activity generated by the CALDERA operation.

The detection work focused on behaviors such as:

- Suspicious PowerShell execution
- Encoded or obfuscated commands
- Execution through trusted Windows utilities
- Suspicious script and file creation
- Persistence-related registry changes
- Unusual parent-child process relationships
- Account and system discovery
- Remote-execution activity

A total of **16 custom detection rules** were developed and mapped to relevant MITRE ATT&CK techniques.

➡️ [View the detection rules](../detection-rules/)

---

## Threat Hunting

Threat hunting was performed using **Kibana Query Language (KQL)** and **Elastic Query Language (ES|QL)**.

The hunting process included:

- Searching for suspicious processes and command lines
- Reviewing PowerShell activity
- Investigating authentication events
- Analysing process relationships
- Examining file and registry changes
- Correlating CALDERA execution times with Elastic events
- Mapping observed behavior to MITRE ATT&CK
- Identifying activity that did not generate an alert

➡️ [View the threat-hunting documentation](detection-and-hunting.md)

➡️ [View the hunting queries](../hunting-queries/)

---

## Incident Response

The project applied the main incident-response phases to the detected activity:

### Identification

Elastic alerts, Windows logs, CALDERA operation records, and hunting queries were used to confirm suspicious activity and identify affected systems.

### Containment

Affected endpoints, accounts, processes, and network activity were reviewed to determine the appropriate containment actions.

### Eradication

Attack artifacts, persistence mechanisms, suspicious files, and unsafe configurations were identified and removed.

### Recovery

System functionality, endpoint connectivity, Elastic Agent health, and log ingestion were verified before returning the environment to normal operation.

### Lessons Learned

Detection gaps, response delays, telemetry limitations, configuration issues, and opportunities for improvement were documented.

➡️ [View the incident-response documentation](incident-response.md)

---

## Validation Metrics

The effectiveness of the SOC workflow was evaluated using the following metrics:

| Metric | Purpose |
|:---|:---|
| **Mean Time to Detect (MTTD)** | Measures the average time between attack execution and detection |
| **Mean Time to Contain (MTTC)** | Measures the average time between detection and containment |
| **Mean Time to Respond/Remediate (MTTR)** | Measures the time required to respond to or remediate detected activity |
| **MITRE ATT&CK Coverage** | Measures how many tested techniques were covered by detection capabilities |
| **False-Positive Rate (FPR)** | Measures the proportion of alerts classified as benign or unrelated |

Metric values were calculated using timestamps and evidence from CALDERA, Elastic Security, and the team’s response records.

➡️ [View the validation metrics](validation-metrics.md)

---

## Technologies and Tools

| Category | Tools |
|:---|:---|
| **Adversary Emulation** | MITRE CALDERA |
| **SIEM and Analytics** | Elastic Security, Elasticsearch, Kibana |
| **Agent Management** | Elastic Fleet |
| **Endpoint Monitoring** | Elastic Agent, Sysmon |
| **Identity Infrastructure** | Active Directory Domain Services, DNS |
| **Operating Systems** | Windows Server 2022, Windows 10, Ubuntu Server |
| **Threat Hunting** | KQL and ES|QL |
| **Framework** | MITRE ATT&CK |
| **Virtualisation** | Virtual laboratory environment |

---

## Project Outcomes

The project successfully demonstrated:

- Deployment of an isolated SOC laboratory
- Integration of Active Directory with monitored endpoints
- Centralized collection of Windows security telemetry
- Execution of selected APT29 techniques
- Creation of 16 custom detection rules
- Development of threat-hunting queries
- Investigation of security alerts and endpoint activity
- MITRE ATT&CK mapping
- Application of incident-response procedures
- Measurement of detection and validation performance
- Identification of telemetry and configuration gaps

The project also improved the team’s practical experience in SOC operations, adversary emulation, detection engineering, threat hunting, incident response, and security validation.

---

## Key Challenges

The main challenges included:

- Connecting virtual machines across different physical devices
- Campus network restrictions
- Elastic Agent and Fleet connectivity
- CALDERA agent availability
- WinRM authentication and permission failures
- Time synchronization between systems
- Delayed telemetry and alert generation
- Distinguishing malicious activity from legitimate administration
- Tuning detection rules to reduce false positives

➡️ [View the challenges and lessons learned](challenges-and-lessons-learned.md)

---

## Repository Documentation

| Document | Description |
|:---|:---|
| [Architecture](architecture.md) | Systems, network design, monitoring components, and data flow |
| [Attack Scenario](attack-scenario.md) | APT29 scenario, CALDERA operation, and ATT&CK mapping |
| [Detection and Threat Hunting](detection-and-hunting.md) | Detection rules, queries, alerts, and investigation process |
| [Incident Response](incident-response.md) | Identification, containment, eradication, recovery, and lessons learned |
| [Validation Metrics](validation-metrics.md) | MTTD, MTTC, MTTR, ATT&CK coverage, and false-positive rate |
| [Challenges and Lessons Learned](challenges-and-lessons-learned.md) | Technical difficulties, solutions, and recommendations |

---

## Security and Ethics

> [!WARNING]
> This repository is intended only for cybersecurity education, defensive research, SOC training, and authorised security testing.

Sensitive information was removed or sanitised before publication. The repository does not contain credentials, private keys, enrollment tokens, active malware, full virtual-machine images, or unnecessarily detailed internal network information.

**The techniques documented in this project must not be used against any system without explicit authorisation.**
