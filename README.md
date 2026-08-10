# KAUST-SOC-APT29-Project
````markdown
# 🛡️ APT29 Adversary Emulation and Threat Detection

> A cybersecurity project demonstrating adversary emulation, threat detection, threat hunting, incident response, and security validation in a controlled SOC laboratory.

---

## 📌 Project Overview

This project demonstrates a complete **Security Operations Center (SOC) workflow** by emulating selected **APT29 tactics, techniques, and procedures (TTPs)** in an isolated and authorized laboratory environment.

**MITRE CALDERA** was used to conduct adversary-emulation operations, while **Elastic Security** was used to:

- Collect endpoint telemetry
- Monitor Windows activity
- Detect suspicious behavior
- Investigate security alerts
- Perform threat hunting
- Support incident-response actions
- Evaluate detection effectiveness

The environment includes a Windows Active Directory domain, two Windows workstations, an Elastic Security server, and a CALDERA adversary-emulation server.

---

## 🎯 Project Objectives

The primary objectives were to:

- Build a functional SOC laboratory environment
- Configure Windows Active Directory and domain-connected endpoints
- Centralize security telemetry using Elastic Agent and Fleet
- Enable Windows auditing and PowerShell logging
- Emulate selected APT29 techniques using MITRE CALDERA
- Develop custom detection rules in Elastic Security
- Perform threat-hunting investigations
- Map attack activities and detections to MITRE ATT&CK
- Apply identification, containment, eradication, and recovery procedures
- Evaluate detection performance using SOC validation metrics
- Document implementation challenges and lessons learned

---

## 🏗️ Lab Architecture

| System | Operating System | Primary Role |
|:---|:---|:---|
| **DC01** | Windows Server 2022 | Active Directory domain controller and DNS server |
| **WS01** | Windows 10 | Domain-connected user workstation |
| **WS02** | Windows 10 | Domain-connected user workstation |
| **ES01** | Linux | Elastic Stack, Fleet, and Elastic Security |
| **CALDERA** | Linux | APT29 adversary-emulation server |

For more information, see the [Architecture Documentation](docs/architecture.md).

---

## 🧰 Technologies and Tools

### Security Platforms

- **Elastic Security**
- **Elastic Stack**
- **Elastic Agent**
- **Fleet**
- **MITRE CALDERA**
- **MITRE ATT&CK**

### Monitoring and Investigation

- **Windows Event Logs**
- **PowerShell Logging**
- **Advanced Audit Policy**
- **Elastic Query Language (ES|QL)**
- **Kibana Query Language (KQL)**

---

## 🔄 Project Workflow

```mermaid
flowchart TD
    A[Build SOC Lab] --> B[Configure AD and Endpoints]
    B --> C[Deploy Elastic Agents]
    C --> D[Enable Security Logging]
    D --> E[Execute CALDERA Operation]
    E --> F[Collect and Analyze Telemetry]
    F --> G[Detect and Hunt]
    G --> H[Incident Response]
    H --> I[Validate Results]
````

The project followed these stages:

1. Designed and configured the virtual SOC laboratory.
2. Deployed Active Directory Domain Services.
3. Joined the Windows workstations to the domain.
4. Installed Elastic Agents on monitored systems.
5. Enabled Windows auditing and PowerShell logging.
6. Developed an APT29 attack profile in CALDERA.
7. Executed selected ATT&CK techniques.
8. Collected and analyzed the generated telemetry.
9. Created detection rules and threat-hunting queries.
10. Investigated alerts in Elastic Security.
11. Performed incident-response activities.
12. Calculated detection and validation metrics.
13. Documented results, challenges, and lessons learned.

---

## ⚔️ Adversary Emulation

MITRE CALDERA was used to reproduce selected APT29 behaviors in the controlled environment.

The emulation focused on techniques that could be observed using Windows and Elastic telemetry. Each tested activity was mapped to its corresponding **MITRE ATT&CK tactic and technique**.

The complete scenario is documented in:

➡️ [APT29 Attack Scenario](docs/attack-scenario.md)

---

## 🔍 Detection and Threat Hunting

Elastic Security was used to monitor and investigate the activity generated during the CALDERA operation.

The detection and hunting process included:

* Collecting Windows and endpoint telemetry
* Monitoring PowerShell execution
* Investigating process and authentication activity
* Creating custom detection rules
* Analyzing Elastic Security alerts
* Running KQL and ES|QL hunting queries
* Mapping detections to MITRE ATT&CK
* Identifying telemetry and detection gaps
* Improving rule accuracy and reducing false positives

### Related Resources

* [Detection and Threat Hunting](docs/detection-and-hunting.md)
* [Detection Rules](detection-rules/)
* [Threat-Hunting Queries](hunting-queries/)

---


### 5. Lessons Learned

The team reviewed:

* Detection gaps
* Response delays
* Logging limitations
* Configuration problems
* False-positive causes
* Opportunities for improving future operations

For detailed response evidence, see:

* [Incident-Response Documentation](docs/incident-response.md)
* [Incident-Response Evidence](incident-response/)

---

## 📊 Validation Metrics

The effectiveness of the SOC workflow was evaluated using the following metrics:

| Metric                                    | Description                                                                |
| :---------------------------------------- | :------------------------------------------------------------------------- |
| **Mean Time to Detect (MTTD)**            | Average time between the execution of an attack activity and its detection |
| **Mean Time to Contain (MTTC)**           | Average time between detection and successful containment                  |
| **Mean Time to Respond/Remediate (MTTR)** | Average time required to respond to or remediate an incident               |
| **MITRE ATT&CK Coverage**                 | Percentage of tested techniques covered by detection capabilities          |
| **False-Positive Rate (FPR)**             | Percentage of generated alerts determined to be benign or unrelated        |

The calculations, evidence sources, and results are available in:

➡️ [Validation Metrics](docs/validation-metrics.md)

---

## 📚 Project Documentation

| Document                                                                 | Contents                                                                |
| :----------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| [Project Overview](docs/project-overview.md)                             | Background, objectives, project scope, and responsibilities             |
| [Architecture](docs/architecture.md)                                     | Laboratory systems, network design, and communication flow              |
| [Attack Scenario](docs/attack-scenario.md)                               | APT29 scenario, CALDERA operation, and ATT&CK mapping                   |
| [Detection and Hunting](docs/detection-and-hunting.md)                   | Detection rules, alert investigations, and hunting methodology          |
| [Incident Response](docs/incident-response.md)                           | Identification, containment, eradication, recovery, and lessons learned |
| [Validation Metrics](docs/validation-metrics.md)                         | MTTD, MTTC, MTTR, ATT&CK coverage, and false-positive analysis          |
| [Challenges and Lessons Learned](docs/challenges-and-lessons-learned.md) | Technical challenges, implemented solutions, and recommendations        |

---

## ⚠️ Key Challenges

The main challenges encountered during the project included:

* Connecting virtual machines hosted on different physical laptops
* Campus wireless-network restrictions
* Configuring Elastic Agent and Fleet connectivity
* Maintaining CALDERA agent availability
* Synchronizing time across all systems
* Configuring Windows auditing and PowerShell logging
* Resolving WinRM permissions and remote-execution failures
* Distinguishing malicious behavior from legitimate administration
* Creating accurate rules while limiting false positives
* Maintaining reliable telemetry throughout attack execution

---

## ✅ Project Outcomes

The project provided practical experience in:

* Designing and deploying a SOC laboratory
* Managing Windows Active Directory infrastructure
* Conducting adversary emulation
* Collecting and analyzing endpoint telemetry
* Developing SIEM detection rules
* Conducting threat-hunting investigations
* Investigating security alerts
* Mapping activity to MITRE ATT&CK
* Applying incident-response procedures
* Measuring detection effectiveness
* Troubleshooting security infrastructure





All activities were performed in a controlled and authorized laboratory environment.

**Do not use the techniques documented in this repository against any system without explicit authorization.**

```
```
