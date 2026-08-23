# 📊 Project Presentation

## Overview

This presentation summarizes the **APT29 Adversary Emulation and Threat Detection** project conducted in an isolated SOC laboratory.

It presents the project architecture, attack scenario, Elastic Security monitoring, detection rules, threat-hunting process, incident-response activities, validation metrics, results, challenges, and lessons learned.

---

## View the Presentation

[![View Presentation](https://img.shields.io/badge/View-Presentation%20PDF-EA4335?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](APT29-SOC-Project-Presentation.pdf)

➡️ **[Open or download the project presentation](APT29-SOC-Project-Presentation.pdf)**

> [!NOTE]
> GitHub may display the PDF directly in the browser. If the preview is unavailable, select **Download raw file** to view it locally.

---

## Presentation Contents

The presentation covers:

1. Project background and motivation
2. Project objectives and scope
3. SOC laboratory architecture
4. Active Directory environment
5. SIEM platform selection
6. MITRE CALDERA adversary emulation
7. APT29 attack scenario
8. Endpoint telemetry collection
9. Elastic Security detection rules
10. Threat-hunting investigations
11. MITRE ATT&CK mapping
12. Incident-response activities
13. Validation metrics
14. Project results
15. Technical challenges
16. Lessons learned and recommendations

---

## Platforms and Technologies

| Category | Technologies |
|:---|:---|
| **Adversary Emulation** | MITRE CALDERA |
| **SIEM and Analytics** | Elastic Security, Elasticsearch, Kibana |
| **Endpoint Monitoring** | Elastic Agent, Fleet, and Sysmon |
| **Identity Infrastructure** | Active Directory Domain Services and DNS |
| **Threat Hunting** | KQL and ES\|QL |
| **Security Frameworks** | MITRE ATT&CK and NIST SP 800-61 Rev. 2 |
| **Operating Systems** | Windows Server 2022, Windows 10, and Ubuntu Server |

---

## Key Results

The presentation highlights the following project outcomes:

- A functional isolated SOC laboratory was deployed.
- Selected APT29 behaviors were successfully emulated.
- Sixteen custom Elastic detection rules were developed.
- Windows, PowerShell, and Sysmon telemetry was collected.
- Threat-hunting investigations reconstructed the attack timeline.
- Tested techniques were mapped to MITRE ATT&CK.
- Incident-response procedures were applied.
- Detection and validation metrics were evaluated.
- Technical and configuration weaknesses were identified.

---

## Related Resources

- [Main Project Documentation](../README.md)
- [Project Overview](../docs/project-overview.md)
- [Lab Architecture](../docs/architecture.md)
- [APT29 Attack Scenario](../docs/attack-scenario.md)
- [Detection and Threat Hunting](../docs/detection-and-hunting.md)
- [Incident Response](../docs/incident-response.md)
- [Validation Metrics](../docs/validation-metrics.md)
- [Project Demonstration](../demo/README.md)

The material is intended for cybersecurity education, SOC training, defensive security research, and authorized security testing.

**Do not use the documented techniques against systems without explicit authorization.**
